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
///
/// # The FOUR lettered refusals, of SIX constructs that can drop the read
///
/// **THE COUNT IS IN THE HEADING ON PURPOSE, AND THIS BLOCK IS WHY.** Its
/// first version enumerated three — A, B and D below — under a heading
/// that read as the complete set, and **silently omitted
/// `canonicalize()`, the one refusal here that stops a path escape.** This
/// card's blind verifier caught it; the correction is C, and it is
/// re-measured below rather than transcribed. **A comment telling the next
/// reader that the accounting is finished when it is not is precisely the
/// defect this whole family exists to correct** — this card's own subject
/// is a landed sentence that was false in exactly that way. A stated count
/// makes the omission visible to the next reader who counts.
///
/// **AND A COUNT WITH NO UNIT CANNOT DO THAT JOB — the repair `T-196`'s
/// verifier wrote for `walk_root` (its correction 2), applied here by
/// `T-208` because the SIBLING got it and the site that STARTED the thread
/// did not.** The heading read *"The FOUR refusals"* over four letters
/// while SIX constructs in this function can drop the read, so a reader
/// doing what the heading invites — recount from source — got a different
/// number with no way to tell an OMISSION from a UNIT MISMATCH, which is
/// the one job the count was added to do. **Recounted hostile at `d7ec96c`,
/// nothing is omitted.** Both counts, so either recount lands:
///
///   FOUR LETTERED REFUSALS  = A, B, C, D — the checks this function makes
///                             ON PURPOSE, and the unit the heading counts.
///   SIX CONSTRUCTS          = those four plus TWO unlettered error arms.
///   FIVE STATEMENTS         = the same six, A and B sharing one `if`.
///
/// The two unlettered ones, in source order: **`symlink_metadata(&path)
/// .ok()?`**, an lstat failure — also the ordinary way every caller asks
/// *is there a `package.json` here?* — and the trailing
/// **`read_to_string(&canon).ok()`**, which is additionally **what shadows
/// refusal B**; B's bullet already turns on that and it is the same
/// construct. Neither is a safety refusal, which is why neither is
/// lettered; both can still drop a read, which is why a recount finds them.
/// **And C is one construct doing TWO jobs** — an error arm AND a
/// resolution — of which only the resolution is pinned; C's own bullet
/// carries the mutant that separates them.
///
/// `T-140-s9` corrected the same shape in `docs_watch.rs` and `T-186` in
/// this crate's `walk_root`, and between them they left the reading rule
/// this block obeys: **two guards with identical text are not the same
/// guard.** What decides whether a half is separately pinnable is what the
/// predicates DOWNSTREAM read — a property of the surrounding function,
/// not of the line. Every classification below was MEASURED at this site
/// (`T-194`'s ledger) and none of it is inherited from either sibling.
///
/// - **A — `is_symlink()` is INERT, and undetectable by construction.**
///   `meta` comes from `symlink_metadata` (lstat), under which a link is
///   neither `is_file()` nor `is_dir()`, so `!meta.is_file()` beside it
///   already refuses every link. `A ⟹ B` inside `A || B`: no fixture can
///   separate them, here or anywhere this idiom appears.
/// - **B — `!meta.is_file()` is INERT TOO, but shadowed DOWNSTREAM rather
///   than by its sibling.** This is where this site DIFFERS from
///   `walk_root`, and it is why the sibling's verdict could not be
///   carried across: `walk_root` filters on the entry's own NAME after the
///   classification, so a directory called `<name>.ts` clears every later
///   predicate and IS separately pinnable there. Here the next thing that
///   touches the path is `read_to_string`, which fails on every non-file,
///   non-symlink type that does not block — so a directory wearing the
///   config file's name returns `None` with this half lifted exactly as it
///   does with it in place. **The attempted body is recorded in the test
///   module below rather than landed**, per `docs/CONVENTIONS.md`: a body
///   that cannot red is the finding.
/// - **A and B TOGETHER are load-bearing, and only jointly.** With both
///   lifted, an inside-pointing link is canonicalized, clears
///   `starts_with`, and IS read through. That is what
///   `an_inside_pointing_symlink_is_refused_by_the_link_classification`
///   below pins — a count-2 mutant, because neither half alone reaches it.
/// - **C — `path.canonicalize()` is LOAD-BEARING, it is the refusal the
///   first version of this block left out, and `T-208` PINNED it.** What
///   it independently contributes is not its `.ok()?` arm but the
///   RESOLUTION it performs before D reads the result: `Path::starts_with`
///   compares COMPONENTS, so `<root>/inside/../../elsewhere/x` textually
///   starts with `<root>` and satisfies D on its own. **Only
///   `canonicalize` collapses the `..`.** Without it D is a prefix test
///   wearing a containment test's name, and every `..` in a caller's `dir`
///   walks straight out of the root.
///   **THE PREMISE, RE-DERIVED AT `d7ec96c` RATHER THAN CARRIED ACROSS**
///   (`T-194` recorded 256/0 at `87929c2`; main moved under it, which is
///   why a quoted count is re-run and not transcribed): with
///   `path.to_path_buf()` in its place and NO probe, the crate is **257
///   passed / 0 failed over 12 targets, exit 0 — NOTHING RED.** That is
///   what unpinned looked like, and it was never a cannot-red finding —
///   which is the distinction B's bullet exists to keep separate.
///   **IT IS NOW PINNED, BY ONE BODY, WITH A COUNT OF ONE.**
///   `a_dot_dot_traversal_never_reads_outside_the_root` in the test module
///   below passes on shipped code (**258/0 over 12 targets, exit 0**) and
///   reds on that lift **ALONE** (**257 passed / 1 failed, exit 101**) with
///   `left: Some("{\"loot\":1}")`. **The failure is an ESCAPE, not a
///   type**: the value it prints is the CONTENT of a file outside the root,
///   which `read_contained` returned to its caller.
///   **AND IT IS THE RESOLUTION THE BODY SEES, NOT THE `.ok()?` ARM —
///   MEASURED, because the first sentence of this bullet used to ARGUE
///   it.** A second one-side mutant that KEEPS the error arm and discards
///   only the resolution — `{ let _ = path.canonicalize().ok()?;
///   path.to_path_buf() }` — reds the same single body with the same loot
///   at `d7ec96c`: **257/1, exit 101.** So the two jobs this one construct
///   does are separated by measurement, and the pinned half is named.
///   **THE SAME CALL IS INERT ONE MODULE OVER, AND THE SIGNATURE DECIDES
///   IT RATHER THAN ANALOGY** (`T-196`, whose verifier drew this):
///   `read_contained(root, dir, name)` takes a CALLER-SUPPLIED segment, so
///   a `..` enters from outside and only this line collapses it;
///   `walk_root(canon_root, languages)` takes NO caller path at all — every
///   path is generated by descending real entries from a canonical root —
///   so this attack cannot exist there, and `T-196` measured it inert at
///   both its refs. **Neither verdict transfers. That is this family's
///   whole lesson, applied to a CALL rather than to a guard.**
/// - **D — `canon.starts_with(root)` is load-bearing, and it is the
///   reason an OUTSIDE-pointing link proves nothing about A or B.**
///   `symlinked_tsconfig_is_never_read` (`tsconfig.rs`) aims its link at a
///   second `TempTree`, so the link is refused TWICE OVER — by A+B and by
///   D — and **either refusal suffices alone**. Measured: it stays GREEN
///   under the full A+B lift, GREEN under a D lift, and reds only when
///   BOTH go. **So "containment alone produces its green" is FALSE**, and
///   this lane wrote that sentence down before measuring it; the honest
///   statement is that the body pins a disjunction and can name no member
///   of it. Its name is kept — `T-186` and `T-194` cite it — and what it
///   actually asserts is stated at its own site.
///   **D depends on C and the two are not interchangeable**: C decides
///   WHAT path D is asked about, so lifting C leaves D truthfully
///   answering a question about the wrong path — the UNCOLLAPSED one,
///   which starts with the root on components and resolves outside it.
///   `T-208`'s body asserts exactly that of its own fixture before it
///   exercises anything, which is what makes its refusal attributable to
///   C rather than to D.
pub(crate) fn read_contained(root: &Path, dir: &str, name: &str) -> Option<String> {
    let path = if dir.is_empty() {
        root.join(name)
    } else {
        root.join(dir).join(name)
    };
    let meta = std::fs::symlink_metadata(&path).ok()?;
    // Refusals A and B. Both are individually shadowed (A by its own
    // sibling, B by `read_to_string` below) and the PAIR is not: it is the
    // only thing standing between an inside-pointing link and a read
    // through it. NOT DELETED, and `T-140-s9`'s ruling is why — a provably
    // behaviour-neutral line on an ADR-010 boundary buys zero
    // discrimination by leaving and costs a visible containment statement.
    if meta.file_type().is_symlink() || !meta.is_file() {
        return None;
    }
    // REFUSAL C, and it is a refusal rather than a conversion — this line
    // is what makes D below a containment test instead of a string-prefix
    // test, because `Path::starts_with` compares components and
    // `<root>/a/../../elsewhere` starts with `<root>` until the `..` is
    // collapsed. LOAD-BEARING, AND PINNED SINCE `T-208` BY
    // `a_dot_dot_traversal_never_reads_outside_the_root`: lifting it to
    // `path.to_path_buf()` left this crate 257/0 with NOTHING RED before
    // that body existed, and reds that body ALONE now — 257/1, exit 101,
    // carrying the contents of a file outside the root. Measured at
    // `d7ec96c`; the RESOLUTION is the pinned half, not the `.ok()?` arm.
    let canon = path.canonicalize().ok()?;
    // Refusal D — load-bearing, the one an outside link meets first, and
    // only as strong as C: it judges whatever path C handed it. The body
    // named above asserts that directly — UNCOLLAPSED, its traversal path
    // clears this line on components alone.
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
    /// `None` until an IMPORT occurrence lands on this pair; `Some(true)`
    /// while every one of them has been a re-export.
    ///
    /// It became an `Option` at T-135, when a second kind of occurrence
    /// arrived that makes no claim either way: a Rust `mod` declaration
    /// creates the pair but says nothing about re-export. A plain `bool`
    /// seeded `true` would have emitted `reexport: true` on every
    /// `mod`-only edge, and seeded `false` would have STRIPPED
    /// `reexport: true` off `pub mod x;` + `pub use x::Item;` — which is
    /// three live edges in this repository's own graph and one assertion
    /// in `tests/golden.rs`.
    reexport: Option<bool>,
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

    // T-135: a Rust `mod` declaration is a dependency edge. It goes
    // through the SAME accumulator a `use` goes through — which buys the
    // merge with an existing `use` edge on the same pair, the dedupe, and
    // `edges.sort_by`'s determinism, none of which a second edge vector
    // would inherit — and it deliberately does NOT get its own `kind`:
    // `GRAPH_EDGE_KINDS` in `app/src/lib/architecture/graph.ts` is a
    // CLOSED vocabulary whose reader skips an unknown kind while emitting
    // a parse issue, and `arch::join` filters `kind != "import"`, so a
    // `kind: "mod"` would be invisible to the map pane and to every drift
    // finding while adding one error-strip entry per edge. Widening that
    // vocabulary is `app-map`'s, not this crate's.
    if let Some(world) = rust_world.as_ref() {
        for (from, to) in world.mod_edges() {
            accumulate_mod(&mut import_edges, file_id(from), file_id(to));
        }
    }

    let mut edges: Vec<Edge> = Vec::with_capacity(import_edges.len() + candidate_edges.len());
    for ((from, to), acc) in import_edges {
        edges.push(Edge {
            from,
            to,
            kind: "import".to_string(),
            symbols: (!acc.symbols.is_empty()).then(|| acc.symbols.into_iter().collect()),
            reexport: (acc.reexport == Some(true)).then_some(true),
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
    let acc = entry_for(edges, from, to);
    acc.reexport = Some(acc.reexport.unwrap_or(true) & reexport);
    if let Some(name) = name {
        acc.symbols.insert(name.to_string());
    }
}

/// One Rust `mod` declaration as an occurrence of its (declaring file,
/// target file) pair (T-135).
///
/// It is deliberately the WEAKEST possible occurrence: it creates the
/// pair and touches nothing else. No `symbols` entry, because a `mod`
/// binds no name OUT of the target file — it binds the target file INTO
/// the tree, which is what the edge itself already says. No `reexport`
/// claim, because `pub mod`-ness is a property of the module's
/// visibility rather than of this dependency, and the extractor does not
/// record it.
///
/// The measurable consequence, and the reason the design is spelled this
/// way: every pair that already carried a `use` edge is emitted
/// BYTE-IDENTICALLY, so the whole graph delta of the `mod` fix is the
/// pairs that had no edge at all.
fn accumulate_mod(edges: &mut BTreeMap<(String, String), EdgeAcc>, from: String, to: String) {
    let _ = entry_for(edges, from, to);
}

fn entry_for<'a>(
    edges: &'a mut BTreeMap<(String, String), EdgeAcc>,
    from: String,
    to: String,
) -> &'a mut EdgeAcc {
    edges.entry((from, to)).or_insert(EdgeAcc {
        symbols: BTreeSet::new(),
        reexport: None,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::testutil::TempTree;

    /// The root must be CANONICAL before it is handed to `read_contained`:
    /// on macOS `std::env::temp_dir()` is `/var/...`, a symlink to
    /// `/private/var/...`, so an uncanonicalized root makes
    /// `canon.starts_with(root)` fail for every inside path and every
    /// assertion below would pass for the wrong reason.
    fn canon_root(t: &TempTree) -> PathBuf {
        t.root().canonicalize().expect("canon")
    }

    /// The refusal `read_contained`'s A+B pair actually delivers, exercised
    /// with a link CONTAINMENT CANNOT RESCUE.
    ///
    /// **This is the body `symlinked_tsconfig_is_never_read` looks like but
    /// is not.** That one aims its link at a second `TempTree`, so
    /// `canon.starts_with(root)` refuses it before the link classification
    /// is consulted; it stays green with both halves of that classification
    /// lifted. Here the link AND its target are inside the root, so
    /// `canonicalize` succeeds, containment holds, and the classification is
    /// the only thing left standing.
    ///
    /// **Smallest killer is a TWO-side lift, and that is a measured
    /// property of the code rather than a weakness of the fixture**
    /// (`T-194`): lifting `is_symlink()` alone leaves `!meta.is_file()`
    /// refusing the link under lstat, and lifting `!meta.is_file()` alone
    /// leaves `is_symlink()` refusing it. No fixture can do better.
    #[cfg(unix)]
    #[test]
    fn an_inside_pointing_symlink_is_refused_by_the_link_classification() {
        use std::os::unix::fs::symlink;
        let t = TempTree::new("contained-inside-link");
        let root = canon_root(&t);
        t.write("real/payload.json", "{\"who\":\"real\"}");

        // POSITIVE CONTROL, built the way the producer builds it: the same
        // call against the real file must SUCCEED. Without it "expected
        // None, got None" is satisfied equally by refused-for-the-right
        // -reason, refused-for-the-wrong-reason, and nothing-was-there.
        assert_eq!(
            read_contained(&root, "real", "payload.json").as_deref(),
            Some("{\"who\":\"real\"}"),
            "control: an ordinary inside file must read, or the refusal below proves nothing"
        );

        symlink(root.join("real/payload.json"), root.join("payload.json")).expect("symlink");
        // Assert the fixture's STATE before exercising it (CONVENTIONS,
        // LIFTING A SAFETY GUARD TO DISCRIMINATE): a plain copy here would
        // make the body pass while testing nothing.
        let meta = std::fs::symlink_metadata(root.join("payload.json")).expect("stat the link");
        assert!(meta.file_type().is_symlink(), "the fixture is not a link");
        assert!(
            root.join("payload.json").canonicalize().expect("canon target").starts_with(&root),
            "the fixture must canonicalize INSIDE the root, or containment refuses it and the \
             link classification is never reached — the exact defect this body exists to avoid"
        );

        assert_eq!(
            read_contained(&root, "", "payload.json"),
            None,
            "a link is not repo content, whatever it points at"
        );
    }

    /// A `..` in the caller's `dir` never reads a file outside the root —
    /// **the body that pins REFUSAL C, `path.canonicalize()`, and pins it
    /// ALONE** (`T-208`).
    ///
    /// **THE ASSERTION IS AN ESCAPE, NOT A TYPE.** With C lifted this body
    /// does not merely observe a `Some` where a `None` was wanted: the
    /// `Some` CARRIES THE BYTES OF A FILE OUTSIDE THE ROOT, and the failure
    /// prints them —
    ///
    ///     assertion `left == right` failed: a .. traversal must not escape
    ///       left: Some("{\"loot\":1}")
    ///      right: None
    ///
    /// **WHY C AND NOT D, ASSERTED IN THE FIXTURE RATHER THAN ARGUED IN A
    /// COMMENT.** `Path::starts_with` compares COMPONENTS, so the
    /// UNCOLLAPSED `<root>/../<sibling>/loot.json` starts with `<root>` and
    /// clears D on its own — which this body asserts before it exercises
    /// anything. D therefore cannot be what refuses this path, and the only
    /// remaining candidate is the resolution C performs.
    ///
    /// **THE LIFTED ARM TERMINATES IN A FIXTURE, SHOWN AND NOT ASSUMED**
    /// (`docs/CONVENTIONS.md`, LIFTING A SAFETY GUARD TO DISCRIMINATE). The
    /// traversal is aimed at a SECOND `TempTree`, reachable as
    /// `../<its basename>` because `TempTree` places every tree under one
    /// parent — asserted here as `root.parent() == outside.parent()` — and
    /// the escaped path is canonicalized and compared to the fixture file
    /// itself, so the guard's discriminating half can reach nothing but a
    /// temp tree that removes itself on drop. The repository's own content
    /// is never on the path.
    ///
    /// **SMALLEST KILLER IS ONE SIDE.** Measured at `d7ec96c`: the crate is
    /// 258 passed / 0 failed over 12 targets with this body on shipped code,
    /// and 257/1 — **this body ALONE** — with `canonicalize()` replaced by
    /// `path.to_path_buf()`. The count is ONE, at crate scope, under
    /// `--no-fail-fast`.
    #[test]
    fn a_dot_dot_traversal_never_reads_outside_the_root() {
        let t = TempTree::new("contained-traversal");
        let outside = TempTree::new("contained-traversal-outside");
        let root = canon_root(&t);
        let outside_root = canon_root(&outside);
        t.write("inside/kept.json", "{\"who\":\"inside\"}");
        outside.write("loot.json", "{\"loot\":1}");

        // POSITIVE CONTROL 1: an ordinary contained read must still SUCCEED,
        // or the refusal below is satisfied by a function that refuses
        // everything.
        assert_eq!(
            read_contained(&root, "inside", "kept.json").as_deref(),
            Some("{\"who\":\"inside\"}"),
            "control: an ordinary inside file must read"
        );
        // POSITIVE CONTROL 2: the loot IS readable when the root contains
        // it, so the `None` below cannot be there-was-nothing-there.
        assert_eq!(
            read_contained(&outside_root, "", "loot.json").as_deref(),
            Some("{\"loot\":1}"),
            "control: the fixture the traversal aims at must be readable in its own root"
        );

        // The fixture's STATE, asserted before the guard is exercised.
        let rel = format!(
            "../{}",
            outside_root
                .file_name()
                .expect("basename")
                .to_str()
                .expect("utf-8 basename")
        );
        assert_eq!(
            root.parent(),
            outside_root.parent(),
            "TempTree places every tree under one parent, so `../<basename>` is a real sibling hop"
        );
        let escaped = root.join(&rel).join("loot.json");
        let escaped_canon = escaped.canonicalize().expect("canon the traversal");
        assert_eq!(
            escaped_canon,
            outside_root.join("loot.json"),
            "the lifted arm must TERMINATE IN THE FIXTURE — pointed at one, not merely started at \
             one — so the discriminating half can never reach repository content"
        );
        assert!(
            !escaped_canon.starts_with(&root),
            "the fixture must be OUTSIDE the root, or there is nothing here to escape"
        );
        // The mechanism, asserted rather than argued: UNCOLLAPSED, this path
        // already satisfies refusal D, because `starts_with` compares
        // COMPONENTS. So D is not what refuses it and C is.
        assert!(
            escaped.starts_with(&root),
            "`Path::starts_with` compares COMPONENTS, so the uncollapsed path clears refusal D on \
             its own — which is precisely why refusal C is load-bearing"
        );

        assert_eq!(
            read_contained(&root, &rel, "loot.json"),
            None,
            "a .. traversal must not escape the root"
        );
    }

    /// A directory wearing the config file's name is refused — and this
    /// body pins the OUTCOME, not the `!meta.is_file()` half.
    ///
    /// **RECORDED FAILED ATTEMPT, and it is the finding this card was sent
    /// to get** (`T-194`, `docs/CONVENTIONS.md` — *"a body that cannot red
    /// is the finding"*). `T-186` found `!meta.is_file()` separately
    /// pinnable in `walk_root` by exactly this fixture shape, and the
    /// obvious move is to carry that verdict one file over. **Measured
    /// here, it does not hold**: with `!meta.is_file()` lifted this body
    /// stays GREEN, because the next thing to touch the path is
    /// `read_to_string`, which fails on a directory and produces the same
    /// `None` the guard would have. The half is shadowed DOWNSTREAM, and no
    /// fixture at this site can separate the two.
    ///
    /// It is kept rather than deleted because the OUTCOME is worth pinning
    /// and because the next reader will otherwise re-run the same attempt.
    /// What it does NOT do is pin a half, and it does not claim to.
    #[test]
    fn a_directory_wearing_the_config_files_name_is_refused() {
        let t = TempTree::new("contained-dir");
        let root = canon_root(&t);
        t.write("real/payload.json", "{\"who\":\"real\"}");
        std::fs::create_dir_all(root.join("payload.json")).expect("mkdir");

        assert_eq!(
            read_contained(&root, "real", "payload.json").as_deref(),
            Some("{\"who\":\"real\"}"),
            "control: an ordinary inside file must read"
        );
        assert_eq!(
            read_contained(&root, "", "payload.json"),
            None,
            "a directory is not a config file"
        );
    }
}
