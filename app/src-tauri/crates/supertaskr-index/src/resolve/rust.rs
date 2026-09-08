//! Rust resolution (T-010): Cargo targets -> module tree -> file edges.
//!
//! The TS side resolves a specifier against the WALKED SET by trying
//! filename candidates. Rust cannot work that way — a file's place in the
//! tree is declared by a `mod` statement somewhere else — so this module
//! builds the tree first and then answers `use` paths against it:
//!
//! 1. Find every `Cargo.toml` above a walked `.rs` file (the TS side's
//!    `PackageIndex::nearest` pattern, memoized the same way).
//! 2. Turn each manifest into its CRATE ROOTS — `[lib]`/`[[bin]]` when
//!    declared, plus cargo's auto-discovered `src/lib.rs`, `src/main.rs`,
//!    `src/bin/*.rs`, `src/bin/*/main.rs`, `build.rs`, `tests/*.rs`,
//!    `tests/*/main.rs`, `examples/…`, `benches/…`.
//! 3. From each root, walk `mod` declarations (`#[path = "…"]` honoured)
//!    to a `module path -> file` map. An INLINE `mod x { … }` maps back to
//!    its own file, which is what makes `crate::x::Item` land on the file
//!    that declares it.
//! 4. Resolve a `use` path by its anchor (`crate::`, `self::`, `super::`,
//!    the crate's own name, a 2018 uniform path, another workspace crate)
//!    and then by LONGEST MODULE PREFIX — the segments past that prefix
//!    are item names, and the first of them is the edge's imported symbol.
//!
//! Everything here is a pure function of the walked set plus the manifest
//! text; no candidate is ever probed on disk, and manifests are read
//! through the same contained reader every other file read uses.
//!
//! # THE `mod` DECLARATION IS ITSELF A DEPENDENCY (T-135)
//!
//! Step 3 above walks `mod` declarations to build the tree, and until
//! T-135 that was ALL it did with them: the tree was consumed only to
//! answer `use` paths, so a file reached by `mod` and never named in a
//! `use` produced no edge at all. That is the strongest dependency Rust
//! has — `mod x;` is what compiles `x` into the crate, and removing it
//! deletes the module from the build — and the graph rated it zero
//! (`T-126-s4`: `lib.rs` gained a real dependency on the dispatch
//! component and the edge count did not move).
//!
//! [`RustWorld::mod_edges`] now carries every resolved declaration as a
//! `(declaring file, target file)` pair, and [`super::resolve_all`] feeds
//! those pairs through the SAME `import` accumulator a `use` goes
//! through. Two consequences are deliberate:
//!
//! - **The pair is recorded at the DECLARATION, never at the queue push.**
//!   [`build_module_tree`] guards on `visited` before pushing, so a
//!   declaration whose target another file already pulled into the walk
//!   pushes nothing — and a push-site recording would silently drop that
//!   declarer. The dependency belongs to whoever wrote `mod`, not to
//!   whoever got there first.
//! - **A `mod` occurrence binds no name and asserts no re-export.** It
//!   contributes no entry to the edge's `symbols` and leaves `reexport`
//!   to the `use` occurrences on the same pair (`super::EdgeAcc`), so a
//!   pair that already carried a `use` edge is emitted byte-identically
//!   and a pair that carries only `mod` declarations is a bare
//!   `{from, to, kind: "import"}`.
//!
//! WHAT IS DELIBERATELY NOT DONE, so the silence is legible: no `call` or
//! `type_ref` edges are emitted for Rust. Those need name resolution
//! inside bodies, and their volume is governed by ADR-014's size budget —
//! the committed graph rides the docs collector's 1 MiB per-file cap, and
//! this task already takes it from 126 files to every `.rs` in the tree.
//! T-135 RULED ON that omission rather than widening it: for the
//! FILE-granularity dependent count `arch blast` computes it is safe (of
//! this repository's 1 256 TypeScript `call`/`type_ref` edges, the number
//! adding a file pair no `import` edge already carries is zero), and for
//! any SYMBOL-granularity question it is not. What Rust still cannot see
//! is a cross-module PATH EXPRESSION with no `use` — `crate::a::b::f()`
//! written inline — and `arch::cycles::render` says so on every run.
//! Import edges (from `use` and now from `mod`), packages, re-exports and
//! `unresolved[]` are the whole contract T-010's criteria name.

use std::collections::{BTreeMap, BTreeSet, VecDeque};
use std::path::Path;
use std::rc::Rc;

use crate::extract::ExtractRecord;

use super::ts::normalize_join;
use super::{parent_dir_of, read_contained};

/// What a `use` path resolved to.
#[derive(Clone, Debug, PartialEq)]
pub(crate) enum RustOutcome {
    /// A file inside the walked set, plus the name this `use` binds out of
    /// it (`"*"` for a glob or for a path that names the module itself).
    File { target: String, name: String },
    /// An external crate. `name` carries the `cargo:` qualifier, because
    /// the graph's package ids must be unique across ecosystems and the
    /// reader enforces `id == "p:" + name` (the `node:fs` shape).
    Pkg { name: String },
    /// The path resolved back to the file it was written in — a real
    /// resolution that carries no edge (`use super::*` inside `mod tests`
    /// is the common case).
    SelfRef,
    /// Closed taxonomy, shared with the TS side.
    Unresolved(&'static str),
}

/// The `[package]`/`[lib]`/`[[bin]]` facts this resolver needs out of a
/// `Cargo.toml`. Everything else in the manifest is ignored on purpose.
#[derive(Clone, Debug, Default, PartialEq)]
pub(crate) struct Manifest {
    pub package: Option<String>,
    pub lib_name: Option<String>,
    pub lib_path: Option<String>,
    pub bin_paths: Vec<String>,
}

/// A deliberately small TOML reader: table headers plus `key = "string"`
/// assignments, quote-aware enough not to cut a `#` inside a string.
///
/// It reads the four keys above and NOTHING else, so an inline table, an
/// array, a multi-line string or a `key.subkey` spelling it cannot parse
/// simply does not answer — and every caller falls back to cargo's own
/// auto-discovery, which is what a manifest that declares nothing means
/// anyway. Adding a TOML crate to buy the remaining shapes would widen
/// this crate's `=`-pinned supply-chain surface for a fallback that
/// already exists.
pub(crate) fn parse_manifest(text: &str) -> Manifest {
    let mut manifest = Manifest::default();
    let mut table = String::new();
    let mut bin_pending: Option<Option<String>> = None;
    for raw in text.lines() {
        let line = strip_comment(raw).trim();
        if line.is_empty() {
            continue;
        }
        if let Some(rest) = line.strip_prefix("[[") {
            if let Some(name) = rest.strip_suffix("]]") {
                flush_bin(&mut manifest, &mut bin_pending);
                table = name.trim().to_string();
                if table == "bin" {
                    bin_pending = Some(None);
                }
                continue;
            }
        }
        if let Some(rest) = line.strip_prefix('[') {
            if let Some(name) = rest.strip_suffix(']') {
                flush_bin(&mut manifest, &mut bin_pending);
                table = name.trim().to_string();
                continue;
            }
        }
        let Some((key, value)) = string_assignment(line) else {
            continue;
        };
        match (table.as_str(), key) {
            ("package", "name") => manifest.package.get_or_insert(value),
            ("lib", "name") => manifest.lib_name.get_or_insert(value),
            ("lib", "path") => manifest.lib_path.get_or_insert(value),
            ("bin", "path") => {
                if let Some(slot) = bin_pending.as_mut() {
                    slot.get_or_insert(value);
                }
                continue;
            }
            _ => continue,
        };
    }
    flush_bin(&mut manifest, &mut bin_pending);
    manifest
}

fn flush_bin(manifest: &mut Manifest, pending: &mut Option<Option<String>>) {
    if let Some(Some(path)) = pending.take() {
        manifest.bin_paths.push(path);
    }
}

/// Everything before the first `#` that is not inside a double-quoted
/// string. A manifest comment can hold anything; a description can hold a
/// `#`.
fn strip_comment(line: &str) -> &str {
    let mut quoted = false;
    let mut escaped = false;
    for (i, ch) in line.char_indices() {
        if escaped {
            escaped = false;
            continue;
        }
        match ch {
            '\\' if quoted => escaped = true,
            '"' => quoted = !quoted,
            '#' if !quoted => return &line[..i],
            _ => {}
        }
    }
    line
}

/// `key = "value"` -> (key, value). Anything else -> None.
fn string_assignment(line: &str) -> Option<(&str, String)> {
    let (key, rest) = line.split_once('=')?;
    let key = key.trim();
    if key.is_empty() || key.contains(['"', '[', '.']) {
        return None;
    }
    let rest = rest.trim();
    let body = rest.strip_prefix('"')?;
    let mut out = String::with_capacity(body.len());
    let mut escaped = false;
    for ch in body.chars() {
        if escaped {
            out.push(ch);
            escaped = false;
            continue;
        }
        match ch {
            '\\' => escaped = true,
            '"' => return Some((key, out)),
            _ => out.push(ch),
        }
    }
    None // unterminated string: not an assignment this reader can answer
}

/// One cargo target root and the module tree reachable from it.
struct Root {
    /// The name other crates spell in a `use` — LIB roots only.
    ident: Option<String>,
    modules: BTreeMap<Vec<String>, String>,
}

pub(crate) struct RustWorld {
    roots: Vec<Root>,
    /// file -> the roots it is a module of, with its module path in each.
    /// Root order is sorted by root path, so this is deterministic.
    homes: BTreeMap<String, Vec<(usize, Vec<String>)>>,
    /// Crate ident -> the index of that crate's LIB root.
    crate_idents: BTreeMap<String, usize>,
    /// Every `mod` declaration that resolved to a WALKED file, as
    /// (declaring file, target file) — the T-135 edge source. A set, so a
    /// module declared once but reached from several cargo targets is one
    /// pair, and the order is a function of the paths rather than of the
    /// walk.
    mod_edges: BTreeSet<(String, String)>,
}

impl RustWorld {
    /// Build the world from the walked Rust files and their extracted
    /// `mod` declarations.
    pub(crate) fn build(
        canon_root: &Path,
        rust_files: &BTreeSet<&str>,
        records: &BTreeMap<String, ExtractRecord>,
    ) -> Self {
        let mut roots: Vec<Root> = Vec::new();
        let mut idents: BTreeMap<String, usize> = BTreeMap::new();
        let discovered = cargo_target_roots(canon_root, rust_files);

        let mut homes: BTreeMap<String, Vec<(usize, Vec<String>)>> = BTreeMap::new();
        let mut mod_edges: BTreeSet<(String, String)> = BTreeSet::new();
        for (file, ident) in discovered {
            let index = roots.len();
            let modules = build_module_tree(
                &file,
                rust_files,
                records,
                &mut homes,
                index,
                &mut mod_edges,
            );
            if let Some(ident) = &ident {
                idents.entry(ident.clone()).or_insert(index);
            }
            roots.push(Root { ident, modules });
        }

        Self {
            roots,
            homes,
            crate_idents: idents,
            mod_edges,
        }
    }

    /// Every resolved `mod` declaration as (declaring file, target file),
    /// sorted. A declaration whose file is not walked is absent — the same
    /// rule the module tree itself applies — and a declaration that
    /// resolves back to its own file is dropped, because a self-edge says
    /// nothing (the `RustOutcome::SelfRef` rule, one layer down).
    pub(crate) fn mod_edges(&self) -> &BTreeSet<(String, String)> {
        &self.mod_edges
    }

    /// True when this file sits under no cargo target at all — an honest
    /// "nothing to anchor against", and the reason a crate-anchored `use`
    /// in it is `not_found` rather than a guess.
    pub(crate) fn is_rooted(&self, file: &str) -> bool {
        self.homes.contains_key(file)
    }

    pub(crate) fn resolve(&self, file: &str, specifier: &str) -> RustOutcome {
        let mut segments: Vec<&str> = specifier.split("::").collect();
        let glob = segments.last() == Some(&"*");
        if glob {
            segments.pop();
        }
        if segments.is_empty() || segments.iter().any(|s| s.is_empty()) {
            return RustOutcome::Unresolved("not_found");
        }
        let anchored = matches!(segments[0], "crate" | "self" | "super" | "$crate");
        if anchored && !self.is_rooted(file) {
            // Nothing to anchor against: this file sits under no cargo
            // target, so `crate::`/`self::`/`super::` name no module tree.
            return RustOutcome::Unresolved("not_found");
        }

        let empty: Vec<(usize, Vec<String>)> = Vec::new();
        for (index, module_path) in self.homes.get(file).unwrap_or(&empty) {
            let root = &self.roots[*index];
            let (base, rest): (Vec<String>, &[&str]) = match segments[0] {
                "crate" | "$crate" => (Vec::new(), &segments[1..]),
                "self" => (module_path.clone(), &segments[1..]),
                "super" => {
                    let climb = segments.iter().take_while(|s| **s == "super").count();
                    if climb > module_path.len() {
                        continue; // climbs out of the crate entirely
                    }
                    (
                        module_path[..module_path.len() - climb].to_vec(),
                        &segments[climb..],
                    )
                }
                first if Some(first) == root.ident.as_deref() => (Vec::new(), &segments[1..]),
                first => {
                    // 2018 uniform path: only when the CURRENT module
                    // really declares that child, otherwise `use serde::…`
                    // in a deep module would swallow the crate name.
                    let mut probe = module_path.clone();
                    probe.push(first.to_string());
                    if !root.modules.contains_key(&probe) {
                        continue;
                    }
                    (module_path.clone(), &segments[..])
                }
            };
            return finish(&root.modules, file, &base, rest, glob);
        }

        if anchored {
            return RustOutcome::Unresolved("not_found");
        }
        if let Some(index) = self.crate_idents.get(segments[0]) {
            let root = &self.roots[*index];
            return finish(&root.modules, file, &[], &segments[1..], glob);
        }
        RustOutcome::Pkg {
            name: format!("cargo:{}", segments[0]),
        }
    }
}

/// Longest module prefix of `base ++ rest`; the first segment past it is
/// the imported name.
fn finish(
    modules: &BTreeMap<Vec<String>, String>,
    from: &str,
    base: &[String],
    rest: &[&str],
    glob: bool,
) -> RustOutcome {
    let mut full: Vec<String> = base.to_vec();
    full.extend(rest.iter().map(|s| (*s).to_string()));
    for cut in (base.len()..=full.len()).rev() {
        let Some(target) = modules.get(&full[..cut].to_vec()) else {
            continue;
        };
        if target == from {
            return RustOutcome::SelfRef;
        }
        let name = if glob || cut == full.len() {
            "*".to_string()
        } else {
            full[cut].clone()
        };
        return RustOutcome::File {
            target: target.clone(),
            name,
        };
    }
    RustOutcome::Unresolved("not_found")
}

/// Every cargo TARGET ROOT among the walked Rust files, as (root file,
/// lib ident) — step 2 of the module doc's four.
///
/// (root file, lib ident) pairs, collected into a set so the root ORDER —
/// and therefore every "first root wins" tie in [`RustWorld::resolve`] —
/// is a function of the tree and not of directory iteration.
///
/// IT IS `pub(crate)` BECAUSE THERE IS EXACTLY ONE COPY OF THIS FACT.
/// `arch::blast` needs the same set for T-135's floor rule — reverse
/// reachability terminates at a build target, so a root has zero
/// dependents BY CONSTRUCTION and a zero there means something different
/// from a zero anywhere else. A second implementation of "what is a cargo
/// target" that could disagree with this one is the T-057 failure the
/// blast-radius card names in its own criteria, so the caller reads this
/// function rather than re-deriving the rules.
pub(crate) fn cargo_target_roots(
    canon_root: &Path,
    rust_files: &BTreeSet<&str>,
) -> BTreeSet<(String, Option<String>)> {
    let manifests = manifest_dirs(canon_root, rust_files);
    let mut discovered: BTreeSet<(String, Option<String>)> = BTreeSet::new();
    for (dir, manifest) in &manifests {
        let Some(package) = &manifest.package else {
            continue; // a virtual workspace manifest declares no crate
        };
        let ident = manifest
            .lib_name
            .clone()
            .unwrap_or_else(|| package.replace('-', "_"));
        let lib = join_dir(dir, manifest.lib_path.as_deref().unwrap_or("src/lib.rs"));
        if let Some(lib) = lib.filter(|p| rust_files.contains(p.as_str())) {
            discovered.insert((lib, Some(ident)));
        }
        let mut others: Vec<String> = manifest
            .bin_paths
            .iter()
            .filter_map(|p| join_dir(dir, p))
            .collect();
        for fixed in ["src/main.rs", "build.rs"] {
            others.extend(join_dir(dir, fixed));
        }
        for (sub, nested) in [
            ("src/bin", true),
            ("tests", true),
            ("examples", true),
            ("benches", true),
        ] {
            let base = match join_dir(dir, sub) {
                Some(base) => base,
                None => continue,
            };
            for file in rust_files {
                let Some(tail) = file.strip_prefix(&format!("{base}/")) else {
                    continue;
                };
                // `<sub>/x.rs` is a target; `<sub>/x/main.rs` is a
                // target; `<sub>/x/helper.rs` is a MODULE of one.
                let is_target = !tail.contains('/')
                    || (nested && tail.matches('/').count() == 1 && tail.ends_with("/main.rs"));
                if is_target && tail.ends_with(".rs") {
                    others.push((*file).to_string());
                }
            }
        }
        for file in others {
            if rust_files.contains(file.as_str()) {
                discovered.insert((file, None));
            }
        }
    }
    discovered
}

/// Every `Cargo.toml` at or above a walked `.rs` file, keyed by its
/// root-relative directory ("" for the repo root).
fn manifest_dirs(canon_root: &Path, rust_files: &BTreeSet<&str>) -> BTreeMap<String, Rc<Manifest>> {
    let mut seen: BTreeSet<String> = BTreeSet::new();
    for file in rust_files {
        let mut dir = parent_dir_of(file);
        loop {
            seen.insert(dir.to_string());
            if dir.is_empty() {
                break;
            }
            dir = parent_dir_of(dir);
        }
    }
    let mut out = BTreeMap::new();
    for dir in seen {
        if let Some(text) = read_contained(canon_root, &dir, "Cargo.toml") {
            out.insert(dir, Rc::new(parse_manifest(&text)));
        }
    }
    out
}

fn join_dir(dir: &str, rel: &str) -> Option<String> {
    normalize_join(dir, rel).filter(|p| !p.is_empty())
}

/// The directory a file's ordinary (`#[path]`-less) child modules live in:
/// beside a crate root or a `mod.rs`, and inside a same-named directory
/// for every other module file.
fn child_dir(file: &str, is_root: bool) -> String {
    let parent = parent_dir_of(file);
    if is_root || file == "mod.rs" || file.ends_with("/mod.rs") {
        parent.to_string()
    } else {
        file.strip_suffix(".rs").unwrap_or(file).to_string()
    }
}

fn under(dir: &str, inside: &[String]) -> String {
    let mut parts: Vec<&str> = dir.split('/').filter(|s| !s.is_empty()).collect();
    parts.extend(inside.iter().map(String::as_str));
    parts.join("/")
}

fn build_module_tree(
    root_file: &str,
    rust_files: &BTreeSet<&str>,
    records: &BTreeMap<String, ExtractRecord>,
    homes: &mut BTreeMap<String, Vec<(usize, Vec<String>)>>,
    root_index: usize,
    mod_edges: &mut BTreeSet<(String, String)>,
) -> BTreeMap<Vec<String>, String> {
    let mut modules: BTreeMap<Vec<String>, String> = BTreeMap::new();
    let mut visited: BTreeSet<String> = BTreeSet::new();
    let mut queue: VecDeque<(Vec<String>, String)> = VecDeque::new();
    queue.push_back((Vec::new(), root_file.to_string()));

    while let Some((module_path, file)) = queue.pop_front() {
        if !visited.insert(file.clone()) {
            continue; // a file pulled in by two `mod` statements
        }
        modules.entry(module_path.clone()).or_insert(file.clone());
        homes
            .entry(file.clone())
            .or_default()
            .push((root_index, module_path.clone()));
        let Some(record) = records.get(&file) else {
            continue;
        };
        let is_root = module_path.is_empty();
        for declaration in &record.mods {
            let mut full = module_path.clone();
            full.extend(declaration.inside.iter().cloned());
            full.push(declaration.name.clone());
            if declaration.inline {
                modules.entry(full).or_insert(file.clone());
                continue;
            }
            let target = match &declaration.file {
                // `#[path]` is relative to the SOURCE FILE's directory
                // (plus any inline module names), where an ordinary `mod`
                // is relative to the MODULE's directory. Two different
                // bases, and the Rust reference is explicit about it.
                Some(attr) => join_dir(
                    &under(parent_dir_of(&file), &declaration.inside),
                    attr,
                )
                .filter(|p| rust_files.contains(p.as_str())),
                None => {
                    let base = under(&child_dir(&file, is_root), &declaration.inside);
                    let stem = if base.is_empty() {
                        declaration.name.clone()
                    } else {
                        format!("{base}/{}", declaration.name)
                    };
                    [format!("{stem}.rs"), format!("{stem}/mod.rs")]
                        .into_iter()
                        .find(|c| rust_files.contains(c.as_str()))
                }
            };
            let Some(target) = target else {
                continue; // declared but not walked: the module is absent
            };
            // T-135: THE EDGE BELONGS TO THE DECLARATION. Recorded here,
            // before the `visited` guard below, because that guard answers
            // "has the walk already been here?" and this answers "who
            // wrote `mod`?" — two different questions with two different
            // answers whenever a file is declared from more than one
            // place. Recording it at the push site instead drops every
            // declarer but the first and still passes every other pin.
            if target != file {
                mod_edges.insert((file.clone(), target.clone()));
            }
            modules.entry(full.clone()).or_insert(target.clone());
            if !visited.contains(&target) {
                queue.push_back((full, target));
            }
        }
    }
    modules
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::extract::Extractor;
    use crate::parse::{Dialect, Parsers};
    use crate::testutil::TempTree;

    fn manifest(text: &str) -> Manifest {
        parse_manifest(text)
    }

    #[test]
    fn the_toml_reader_finds_the_four_keys_and_ignores_everything_else() {
        let m = manifest(
            "# a comment with [lib] and name = \"decoy\" in it\n\
             [package]\n\
             name = \"supertaskr\"   # trailing comment\n\
             description = \"has a # inside a string\"\n\
             edition = \"2021\"\n\
             \n\
             [[bin]]\n\
             name = \"one\"\n\
             path = \"src/bin/one.rs\"\n\
             \n\
             [[bin]]\n\
             path = \"src/bin/two.rs\"\n\
             \n\
             [lib]\n\
             name = \"supertaskr_lib\"\n\
             crate-type = [\"staticlib\", \"cdylib\", \"rlib\"]\n\
             \n\
             [dependencies]\n\
             serde = { version = \"1\", features = [\"derive\"] }\n",
        );
        assert_eq!(m.package.as_deref(), Some("supertaskr"));
        assert_eq!(m.lib_name.as_deref(), Some("supertaskr_lib"));
        assert_eq!(m.lib_path, None);
        assert_eq!(m.bin_paths, vec!["src/bin/one.rs", "src/bin/two.rs"]);
    }

    #[test]
    fn a_virtual_workspace_manifest_declares_no_package() {
        let m = manifest("[workspace]\nmembers = [\"a\", \"b\"]\nresolver = \"2\"\n");
        assert_eq!(m, Manifest::default());
    }

    #[test]
    fn shapes_the_reader_cannot_parse_answer_nothing_rather_than_wrongly() {
        // Inline table, array-of-one, and a multi-line basic string: each
        // must leave the key UNSET so the caller falls back to cargo's own
        // auto-discovery.
        let m = manifest(
            "[lib]\npath = { file = \"src/lib.rs\" }\n[package]\nname = \"\"\"\nmulti\n\"\"\"\n",
        );
        assert_eq!(m.lib_path, None);
        // A `"""` opener reads as an empty string followed by junk; the
        // reader answers with the empty string rather than "multi", which
        // is why callers treat an empty package name as absent.
        assert_eq!(m.package.as_deref(), Some(""));
    }

    #[test]
    fn strip_comment_respects_quotes_and_escapes() {
        assert_eq!(strip_comment("a = \"x#y\" # tail"), "a = \"x#y\" ");
        assert_eq!(strip_comment("# whole line"), "");
        assert_eq!(strip_comment("a = \"x\\\"#y\""), "a = \"x\\\"#y\"");
    }

    /// Build a world over a synthetic tree. Files are (rel, source).
    fn world(files: &[(&str, &str)]) -> (TempTree, RustWorld, BTreeMap<String, ExtractRecord>) {
        let tree = TempTree::new("rust-world");
        for (rel, source) in files {
            tree.write(rel, source);
        }
        let mut parsers = Parsers::new().expect("grammars");
        let mut records: BTreeMap<String, ExtractRecord> = BTreeMap::new();
        let mut rust: BTreeSet<String> = BTreeSet::new();
        for (rel, source) in files {
            if !rel.ends_with(".rs") {
                continue;
            }
            let parsed = parsers.parse(Dialect::Rust, source).expect("parse");
            records.insert(
                (*rel).to_string(),
                crate::extract::rust::RustExtractor.extract(source, &parsed),
            );
            rust.insert((*rel).to_string());
        }
        let canon = tree.root().canonicalize().expect("canon");
        let refs: BTreeSet<&str> = rust.iter().map(String::as_str).collect();
        let built = RustWorld::build(&canon, &refs, &records);
        (tree, built, records)
    }

    const MANIFEST: &str = "[package]\nname = \"demo-crate\"\n";

    fn file(target: &str, name: &str) -> RustOutcome {
        RustOutcome::File {
            target: target.to_string(),
            name: name.to_string(),
        }
    }

    #[test]
    fn crate_super_self_and_uniform_paths_all_reach_files() {
        let (_t, w, _) = world(&[
            ("Cargo.toml", MANIFEST),
            (
                "src/lib.rs",
                "pub mod agent;\npub mod util;\npub const TOP: u8 = 1;\n",
            ),
            (
                "src/agent/mod.rs",
                "pub mod runner;\nuse crate::util::Helper;\nuse runner::RunEvent;\n",
            ),
            (
                "src/agent/runner.rs",
                "use super::Shared;\nuse self::inner::Thing;\nuse crate::TOP;\nmod inner {}\n",
            ),
            ("src/util.rs", "pub struct Helper;\n"),
        ]);
        assert_eq!(
            w.resolve("src/agent/mod.rs", "crate::util::Helper"),
            file("src/util.rs", "Helper")
        );
        // A 2018 uniform path: `runner` is a child of THIS module.
        assert_eq!(
            w.resolve("src/agent/mod.rs", "runner::RunEvent"),
            file("src/agent/runner.rs", "RunEvent")
        );
        assert_eq!(
            w.resolve("src/agent/runner.rs", "super::Shared"),
            file("src/agent/mod.rs", "Shared")
        );
        // `crate::TOP` has no module past the root, so the root file it is.
        assert_eq!(
            w.resolve("src/agent/runner.rs", "crate::TOP"),
            file("src/lib.rs", "TOP")
        );
        // An inline module maps back to its own file: resolved, no edge.
        assert_eq!(
            w.resolve("src/agent/runner.rs", "self::inner::Thing"),
            RustOutcome::SelfRef
        );
    }

    #[test]
    fn the_longest_module_prefix_wins_and_names_the_imported_symbol() {
        let (_t, w, _) = world(&[
            ("Cargo.toml", MANIFEST),
            ("src/lib.rs", "pub mod a;\n"),
            ("src/a/mod.rs", "pub mod b;\npub struct A;\n"),
            ("src/a/b.rs", "pub struct B;\n"),
        ]);
        assert_eq!(w.resolve("src/lib.rs", "crate::a::A"), file("src/a/mod.rs", "A"));
        assert_eq!(w.resolve("src/lib.rs", "crate::a::b::B"), file("src/a/b.rs", "B"));
        // The path names the module itself: the whole module is taken.
        assert_eq!(w.resolve("src/lib.rs", "crate::a::b"), file("src/a/b.rs", "*"));
        assert_eq!(w.resolve("src/lib.rs", "crate::a::b::*"), file("src/a/b.rs", "*"));
    }

    #[test]
    fn a_path_attribute_relocates_a_module_from_the_source_files_own_dir() {
        let (_t, w, _) = world(&[
            ("Cargo.toml", MANIFEST),
            (
                "src/lib.rs",
                "#[path = \"odd/place.rs\"]\nmod relocated;\npub mod host;\n",
            ),
            ("src/odd/place.rs", "pub struct Moved;\n"),
            ("src/host.rs", "#[path = \"sibling.rs\"]\nmod escapee;\n"),
            ("src/sibling.rs", "pub struct Sib;\n"),
            // The DECOY: where the base would be if `#[path]` followed the
            // ordinary `mod` rule (`src/host/`) instead of the source
            // file's own directory. Choosing it is the failure this body
            // discriminates.
            ("src/host/sibling.rs", "pub struct Wrong;\n"),
        ]);
        assert_eq!(
            w.resolve("src/lib.rs", "crate::relocated::Moved"),
            file("src/odd/place.rs", "Moved")
        );
        assert_eq!(
            w.resolve("src/lib.rs", "crate::host::escapee::Sib"),
            file("src/sibling.rs", "Sib")
        );
    }

    #[test]
    fn workspace_crates_resolve_by_their_lib_name_and_everything_else_is_a_package() {
        let (_t, w, _) = world(&[
            ("Cargo.toml", "[package]\nname = \"app\"\n[lib]\nname = \"app_lib\"\n"),
            ("src/lib.rs", "pub mod docs;\n"),
            ("src/docs.rs", "pub struct Watch;\n"),
            ("crates/idx/Cargo.toml", "[package]\nname = \"supertaskr-index\"\n"),
            ("crates/idx/src/lib.rs", "pub struct Graph;\n"),
            (
                "tests/it.rs",
                "use app_lib::docs::Watch;\nuse supertaskr_index::Graph;\nuse serde::Serialize;\nuse std::fs;\n",
            ),
        ]);
        assert_eq!(
            w.resolve("tests/it.rs", "app_lib::docs::Watch"),
            file("src/docs.rs", "Watch")
        );
        // Package name with a hyphen -> the ident uses underscores.
        assert_eq!(
            w.resolve("tests/it.rs", "supertaskr_index::Graph"),
            file("crates/idx/src/lib.rs", "Graph")
        );
        for (spec, name) in [("serde::Serialize", "cargo:serde"), ("std::fs", "cargo:std")] {
            assert_eq!(
                w.resolve("tests/it.rs", spec),
                RustOutcome::Pkg {
                    name: name.to_string()
                }
            );
        }
    }

    #[test]
    fn auto_discovered_targets_are_roots_and_their_neighbours_are_modules() {
        let (_t, w, _) = world(&[
            ("Cargo.toml", MANIFEST),
            ("src/lib.rs", "pub struct Lib;\n"),
            ("src/main.rs", "fn main() {}\n"),
            ("src/bin/tool.rs", "mod helper;\nuse helper::H;\n"),
            ("src/bin/helper.rs", "pub struct H;\n"),
            ("build.rs", "fn main() {}\n"),
            ("tests/it.rs", "mod common;\nuse common::Fixture;\n"),
            ("tests/common/mod.rs", "pub struct Fixture;\n"),
        ]);
        assert!(w.is_rooted("src/main.rs"), "src/main.rs is a bin target");
        assert!(w.is_rooted("build.rs"), "build.rs is the build script target");
        assert_eq!(
            w.resolve("src/bin/tool.rs", "helper::H"),
            file("src/bin/helper.rs", "H")
        );
        assert_eq!(
            w.resolve("tests/it.rs", "common::Fixture"),
            file("tests/common/mod.rs", "Fixture")
        );
        // `tests/common/mod.rs` is a MODULE of the test target, never a
        // target of its own.
        assert!(w.is_rooted("tests/common/mod.rs"));
    }

    #[test]
    fn unresolved_records_a_reason_and_a_positive_control_proves_it_would_have_resolved() {
        // POSITIVE CONTROL FIRST: the same shape, one level shallower,
        // really does resolve — so the refusals below are refusals and not
        // an absence.
        let (_t, w, _) = world(&[
            ("Cargo.toml", MANIFEST),
            ("src/lib.rs", "pub mod a;\npub struct Top;\n"),
            (
                "src/a.rs",
                "use super::Top;\nuse super::super::Escaped;\n",
            ),
            ("orphan/loose.rs", "use crate::Nothing;\nuse std::fs;\n"),
        ]);
        assert_eq!(w.resolve("src/a.rs", "super::Top"), file("src/lib.rs", "Top"));
        // One `super` too many climbs out of the crate.
        assert_eq!(
            w.resolve("src/a.rs", "super::super::Escaped"),
            RustOutcome::Unresolved("not_found")
        );
        // A file under no cargo target has nothing to anchor `crate::` to.
        assert!(!w.is_rooted("orphan/loose.rs"));
        assert_eq!(
            w.resolve("orphan/loose.rs", "crate::Nothing"),
            RustOutcome::Unresolved("not_found")
        );
        // …but an unanchored path in the same file is still a package,
        // which is what makes the two answers different rather than one
        // blanket refusal.
        assert_eq!(
            w.resolve("orphan/loose.rs", "std::fs"),
            RustOutcome::Pkg {
                name: "cargo:std".to_string()
            }
        );
    }

    #[test]
    fn a_declared_module_whose_file_is_not_walked_simply_is_not_there() {
        let (_t, w, _) = world(&[
            ("Cargo.toml", MANIFEST),
            ("src/lib.rs", "mod present;\nmod missing;\npub struct Top;\n"),
            ("src/present.rs", "pub struct P;\n"),
        ]);
        assert_eq!(
            w.resolve("src/lib.rs", "crate::present::P"),
            file("src/present.rs", "P")
        );
        // `missing` has no file, so the longest prefix is the crate root.
        assert_eq!(
            w.resolve("src/lib.rs", "crate::missing::X"),
            RustOutcome::SelfRef
        );
    }

    /// Every shape a `mod` declaration takes, as (declarer, target)
    /// pairs (T-135). The tree builder already resolved all of these to
    /// answer `use` paths; this pins that the DEPENDENCY they represent
    /// is now recorded too.
    #[test]
    fn every_resolved_mod_declaration_is_recorded_as_a_pair() {
        let (_t, w, _) = world(&[
            ("Cargo.toml", MANIFEST),
            (
                "src/lib.rs",
                "pub mod agent;\nmod util;\n#[path = \"odd/place.rs\"]\nmod moved;\nmod absent;\nmod inline_only { pub fn f() {} }\n",
            ),
            ("src/agent/mod.rs", "pub mod runner;\n"),
            ("src/agent/runner.rs", "pub struct R;\n"),
            ("src/util.rs", "pub struct Helper;\n"),
            ("src/odd/place.rs", "pub struct Moved;\n"),
        ]);
        let pairs: Vec<(&str, &str)> = w
            .mod_edges()
            .iter()
            .map(|(from, to)| (from.as_str(), to.as_str()))
            .collect();
        assert_eq!(
            pairs,
            vec![
                // `mod.rs` form, one level down.
                ("src/agent/mod.rs", "src/agent/runner.rs"),
                // ordinary `pub mod` from the crate root…
                ("src/lib.rs", "src/agent/mod.rs"),
                // …a `#[path]` relocation, based on the DECLARER's dir…
                ("src/lib.rs", "src/odd/place.rs"),
                // …and a private sibling `mod`.
                ("src/lib.rs", "src/util.rs"),
            ],
            "`mod absent;` has no walked file and an INLINE `mod` names no other file: neither is a pair"
        );
    }

    /// THE DISCRIMINATOR between recording the pair at the DECLARATION
    /// and recording it at the queue push.
    ///
    /// `build_module_tree` pushes a target only when `visited` does not
    /// already hold it, and `visited` fills at POP time. So the
    /// declaration order below is load-bearing: `shared` is declared
    /// first, so it is popped before `one` is, and by the time `one`'s
    /// own `#[path]` declaration of the same file is read the push is
    /// suppressed. A push-site implementation records two pairs here and
    /// passes every other body in this file; this one records three.
    #[test]
    fn a_declaration_of_an_already_visited_module_is_still_that_files_dependency() {
        let (_t, w, _) = world(&[
            ("Cargo.toml", MANIFEST),
            (
                "src/lib.rs",
                "#[path = \"shared.rs\"]\nmod shared;\npub mod one;\n",
            ),
            ("src/one.rs", "#[path = \"shared.rs\"]\nmod aliased;\n"),
            ("src/shared.rs", "pub struct S;\n"),
        ]);
        let pairs: Vec<(&str, &str)> = w
            .mod_edges()
            .iter()
            .map(|(from, to)| (from.as_str(), to.as_str()))
            .collect();
        assert_eq!(
            pairs,
            vec![
                ("src/lib.rs", "src/one.rs"),
                ("src/lib.rs", "src/shared.rs"),
                ("src/one.rs", "src/shared.rs"),
            ],
            "the third pair is the whole point: src/one.rs really does declare src/shared.rs"
        );
    }

    /// A module shared by several cargo TARGETS is a dependency of each
    /// of them. `tests/common/mod.rs` is the live case — eight test roots
    /// declare it in this repository — and each root is walked with its
    /// own `visited` set, so this pins the ACCUMULATION across roots
    /// rather than within one.
    #[test]
    fn a_module_declared_by_several_targets_is_a_dependency_of_every_one_of_them() {
        let (_t, w, _) = world(&[
            ("Cargo.toml", MANIFEST),
            ("src/lib.rs", "pub struct Lib;\n"),
            ("tests/a.rs", "mod common;\n"),
            ("tests/b.rs", "mod common;\n"),
            ("tests/c.rs", "mod common;\n"),
            ("tests/common/mod.rs", "pub struct Fixture;\n"),
        ]);
        let declarers: Vec<&str> = w
            .mod_edges()
            .iter()
            .filter(|(_, to)| to == "tests/common/mod.rs")
            .map(|(from, _)| from.as_str())
            .collect();
        assert_eq!(declarers, vec!["tests/a.rs", "tests/b.rs", "tests/c.rs"]);
    }

    /// The SEAM: a module declared inside an inline `mod` block is a real
    /// edge of the tree, and its file lives one directory deeper. The
    /// extractor's own body pins the RECORD; this pins that the tree
    /// builder consumes it — a different call, and the only one that can
    /// see an inline prefix being dropped between the two.
    #[test]
    fn an_inline_nested_module_is_a_real_branch_of_the_tree() {
        let (_t, w, records) = world(&[
            ("Cargo.toml", MANIFEST),
            ("src/lib.rs", "#[cfg(test)]\nmod tests { mod deep; }\n"),
            ("src/tests/deep.rs", "pub struct Deep;\n"),
            // The DECOY: where the file would be if the inline prefix were
            // dropped on the way into the tree.
            ("src/deep.rs", "pub struct Wrong;\n"),
        ]);
        assert_eq!(
            records["src/lib.rs"].mods.last().map(|m| m.inside.as_slice()),
            Some(["tests".to_string()].as_slice()),
        );
        assert_eq!(
            w.resolve("src/lib.rs", "crate::tests::deep::Deep"),
            file("src/tests/deep.rs", "Deep")
        );
    }
}
