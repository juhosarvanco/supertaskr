//! ignore-crate walker + containment (plan §3).
//!
//! Every setting below is a determinism or containment decision — the
//! committed graph must reproduce byte-identically on any machine, so no
//! machine-local ignore source may participate, and no path outside the
//! canonical root may ever be read (T-003's symlink/canonicalization
//! rules, inherited per §0.0 item 7).

use std::path::{Path, PathBuf};

use crate::graph::Lang;

/// A file the walk accepted: root-relative POSIX path + the canonical
/// absolute path every subsequent read must use.
#[derive(Clone, Debug)]
pub(crate) struct WalkedFile {
    pub rel: String,
    pub abs: PathBuf,
    pub lang: Lang,
}

/// Join path components with `/` regardless of platform (T-003 pattern).
///
/// **AND IT IS A CONTAINMENT PREDICATE, NOT ONLY A FORMATTER** (T-186).
/// `strip_prefix(base).ok()?` returns `None` for every path outside
/// `base`, which is `walk_root`'s layer 4 and the line that still refuses
/// an escaped path when the explicit `starts_with` above it is lifted.
/// Softening the `?` to a lossy join would leave that check the only
/// containment in the walk, silently. Pinned by
/// `relative_posix_is_the_containment_predicate_the_walk_relies_on`.
pub(crate) fn relative_posix(path: &Path, base: &Path) -> Option<String> {
    let rel = path.strip_prefix(base).ok()?;
    let parts: Vec<String> = rel
        .components()
        .map(|c| c.as_os_str().to_string_lossy().into_owned())
        .collect();
    Some(parts.join("/"))
}

/// Walk `canon_root` (already canonicalized by the caller) and return the
/// allowlisted files, sorted by relative path (walk order is never
/// trusted — collected then sorted).
///
/// Ignore input set, exactly: in-tree `.gitignore` + in-tree
/// `.nputerignore` (gitignore syntax, any directory level, highest
/// ignore-file precedence). `.git` and `node_modules` are hard-skipped
/// unconditionally, regardless of ignore files. All machine-local
/// sources — global gitignore, `.git/info/exclude`, ignore files above
/// the root, generic `.ignore` — are OFF.
pub(crate) fn walk_root(canon_root: &Path, languages: &[Lang]) -> Vec<WalkedFile> {
    let mut files: Vec<WalkedFile> = Vec::new();

    let mut builder = ignore::WalkBuilder::new(canon_root);
    builder
        .follow_links(false)
        .hidden(false) // tracked hidden dirs may hold real code
        .git_ignore(true)
        .require_git(false) // deterministic on export/tarball copies
        .git_global(false)
        .git_exclude(false)
        .parents(false)
        .ignore(false);
    builder.add_custom_ignore_filename(".nputerignore");
    builder.filter_entry(|entry| {
        let name = entry.file_name();
        name != ".git" && name != "node_modules"
    });

    for result in builder.build() {
        let Ok(entry) = result else { continue };
        if entry.depth() == 0 {
            continue; // the root itself
        }
        let path = entry.path();
        // LAYER 1 — the link classification, beyond `follow_links(false)`
        // above. This is the layer `symlinks_are_never_followed_file_or_dir`
        // is NAMED after.
        //
        // **THE `is_symlink()` HALF IS INERT, AND THAT IS A FACT ABOUT
        // `symlink_metadata` RATHER THAN ABOUT THE TESTS** (T-186,
        // measured here; T-140-s9 established the same shape one crate
        // over). `meta` describes the LINK, and under lstat a link is
        // neither `is_file()` nor `is_dir()` — so lifting `is_symlink()`
        // alone drops the entry one operand to its right, at
        // `!meta.is_file()`, with nothing observable moved. No fixture can
        // separate the two halves, so the strongest body that can exist
        // pins them JOINTLY:
        // `a_symlink_to_an_inside_file_is_refused_by_the_link_checks_alone`.
        //
        // **`!meta.is_file()` IS NOT MERELY THAT SHADOW.** It is the only
        // refusal standing between the emitted set and every non-file, and
        // unlike its sibling one crate over it is separately detectable
        // here: a DIRECTORY named `<name>.ts` clears every later predicate
        // and would be emitted as a source file. Pinned alone by
        // `a_directory_named_like_a_source_file_is_refused_as_a_non_file`.
        // Sockets, fifos and devices ride the same line.
        let Ok(meta) = std::fs::symlink_metadata(path) else {
            continue;
        };
        if meta.file_type().is_symlink() || !meta.is_file() {
            continue;
        }
        // LAYER 2 — the allowlist, by extension and by requested language.
        // **IT READS THE ENTRY'S OWN NAME AND NEVER ITS TARGET**, so it can
        // rescue nothing layer 1 refuses: a link called `x.ts` carries an
        // allowlisted name whatever it points at. That asymmetry is this
        // crate's and not `docs_watch`'s, and it is why T-186 could not
        // inherit that lane's "undetectable by construction" verdict — the
        // classifier that dropped an inside-pointing link THERE is, HERE,
        // a predicate the link passes.
        let Some(ext) = path.extension().and_then(|e| e.to_str()) else {
            continue;
        };
        let Some(lang) = Lang::for_extension(ext) else {
            continue;
        };
        if !languages.contains(&lang) {
            continue;
        }
        // LAYER 3 — containment after canonicalization, which resolves the
        // whole chain, so this is what an ESCAPED path meets.
        //
        // **THIS AND `relative_posix`'s `strip_prefix` ARE ONE PREDICATE
        // WRITTEN TWICE, NOT TWO LAYERS** (T-186, correcting this site's
        // own "belt-and-suspenders beyond follow_links(false)" — a claim
        // of independent depth that was the actual defect, because it told
        // every reader a test could tell the layers apart).
        // `Path::strip_prefix` is documented to succeed exactly when
        // `Path::starts_with` holds, both over whole COMPONENTS, so the two
        // cannot disagree about any path and lifting this line is
        // undetectable by construction.
        //
        // IT STAYS. A provably behaviour-neutral line cannot make any test
        // sharper by leaving, and this is an ADR-010 boundary where the
        // containment argument belongs in sight at the site that makes it
        // — it is named here as restatement rather than left to read as
        // depth. The equivalence itself is pinned once for the workspace,
        // by `docs_watch`'s `the_prefix_check_and_relative_posix_are_one_predicate`;
        // a std-library property does not vary by crate, and a second copy
        // here would kill no mutant the first does not (CONVENTIONS,
        // poison shape SIX).
        let Ok(canon) = path.canonicalize() else {
            continue;
        };
        if !canon.starts_with(canon_root) {
            continue;
        }
        // LAYER 4 — and the containment that is actually LOAD-BEARING
        // rather than a restatement: with layer 3 lifted, THIS is what
        // still refuses an escaped path. Its stated job is formatting; its
        // real job is this. Pinned by
        // `relative_posix_is_the_containment_predicate_the_walk_relies_on`.
        let Some(rel) = relative_posix(&canon, canon_root) else {
            continue;
        };
        files.push(WalkedFile {
            rel,
            abs: canon,
            lang,
        });
    }

    files.sort_by(|a, b| a.rel.cmp(&b.rel));
    files.dedup_by(|a, b| a.rel == b.rel);
    files
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::testutil::TempTree;

    fn rels(root: &Path) -> Vec<String> {
        let canon = root.canonicalize().expect("canon root");
        walk_root(&canon, &[Lang::Ts, Lang::Js])
            .into_iter()
            .map(|f| f.rel)
            .collect()
    }

    #[test]
    fn collects_allowlisted_extensions_sorted_recursively() {
        let t = TempTree::new("walk-basic");
        t.write("src/b.ts", "export const b = 1;");
        t.write("src/a.tsx", "export const a = 1;");
        t.write("src/deep/c.mts", "export const c = 1;");
        t.write("src/deep/d.cts", "export const d = 1;");
        t.write("e.js", "var e = 1;");
        t.write("f.jsx", "var f = 1;");
        t.write("skip.mjs", "var g = 1;"); // deliberately excluded
        t.write("skip.cjs", "var h = 1;"); // deliberately excluded
        // `.rs` IS an allowlisted extension since T-010; it is absent from
        // the list below only because `rels` asks for [Ts, Js] — the
        // languages_option test one body down is where that is pinned.
        t.write("native.rs", "fn main() {}");
        t.write("notes.md", "# nope");
        assert_eq!(
            rels(t.root()),
            vec![
                "e.js",
                "f.jsx",
                "src/a.tsx",
                "src/b.ts",
                "src/deep/c.mts",
                "src/deep/d.cts",
            ]
        );
    }

    #[test]
    fn languages_option_limits_collection() {
        let t = TempTree::new("walk-langs");
        t.write("a.ts", "export const a = 1;");
        t.write("b.js", "var b = 1;");
        t.write("c.rs", "fn main() {}");
        let canon = t.root().canonicalize().unwrap();
        let rels = |langs: &[Lang]| -> Vec<String> {
            walk_root(&canon, langs).into_iter().map(|f| f.rel).collect()
        };
        assert_eq!(rels(&[Lang::Ts]), vec!["a.ts"]);
        // T-010: Rust is collected when asked for, and asking for it does
        // not drag the others in.
        assert_eq!(rels(&[Lang::Rust]), vec!["c.rs"]);
        assert_eq!(
            rels(&[Lang::Ts, Lang::Js, Lang::Rust]),
            vec!["a.ts", "b.js", "c.rs"]
        );
    }

    #[test]
    fn git_and_node_modules_are_hard_skipped_even_when_not_ignored() {
        let t = TempTree::new("walk-hardskip");
        t.write("real.ts", "export const r = 1;");
        t.write("node_modules/decoy/index.ts", "export const decoy = 1;");
        t.write(".git/hook.ts", "export const hook = 1;");
        t.write("nested/node_modules/x.ts", "export const x = 1;");
        // No .gitignore at all — the skip must be unconditional.
        assert_eq!(rels(t.root()), vec!["real.ts"]);
    }

    #[test]
    fn gitignore_and_nputerignore_both_apply_without_a_git_repo() {
        let t = TempTree::new("walk-ignores");
        t.write("kept.ts", "export const k = 1;");
        t.write("ignored-by-git.ts", "export const g = 1;");
        t.write("private/secret.ts", "export const s = 1;");
        t.write(".gitignore", "ignored-by-git.ts\n");
        t.write(".nputerignore", "private/\n");
        assert_eq!(rels(t.root()), vec!["kept.ts"]);
    }

    #[test]
    fn nputerignore_wins_over_a_gitignore_negation() {
        // Custom ignore files have the highest ignore-file precedence in
        // the ignore crate: a .gitignore re-include cannot beat it.
        let t = TempTree::new("walk-precedence");
        t.write("a.ts", "export const a = 1;");
        t.write("hide/b.ts", "export const b = 1;");
        t.write(".gitignore", "!hide/\n");
        t.write(".nputerignore", "hide/\n");
        assert_eq!(rels(t.root()), vec!["a.ts"]);
    }

    #[test]
    fn hidden_directories_are_walked() {
        let t = TempTree::new("walk-hidden");
        t.write(".hidden/real.ts", "export const h = 1;");
        t.write("a.ts", "export const a = 1;");
        assert_eq!(rels(t.root()), vec![".hidden/real.ts", "a.ts"]);
    }

    #[cfg(unix)]
    #[test]
    fn symlinks_are_never_followed_file_or_dir() {
        // **THE NAME IS THE OUTCOME, NOT THE LAYER** (T-186). Both links
        // below point into a SECOND, OUTSIDE tree, so every entry they
        // produce canonicalizes out of the root and layers 3/4 refuse it
        // without layer 1 ever mattering — this body stays GREEN with the
        // whole link classification lifted, and what it actually pins is
        // CONTAINMENT. Measured, not inferred; see the ledger below.
        //
        // It KEEPS its name: two cards cite it (T-140-s9, T-186) and a
        // rename would strand those references, which is the disposition
        // this project takes for a stale headline whose body carries the
        // correction. The layer the name promises is pinned by
        // `a_symlink_to_an_inside_file_is_refused_by_the_link_checks_alone`.
        use std::os::unix::fs::symlink;
        let t = TempTree::new("walk-symlink");
        t.write("real.ts", "export const r = 1;");
        let outside = TempTree::new("walk-symlink-outside");
        outside.write("secret.ts", "export const secret = 1;");
        symlink(outside.root().join("secret.ts"), t.root().join("link.ts"))
            .expect("file symlink");
        symlink(outside.root(), t.root().join("linkdir")).expect("dir symlink");
        assert_eq!(rels(t.root()), vec!["real.ts"]);
    }

    // THE LIFT LEDGER (T-186). Every row RUN, not reasoned, in a detached
    // scratch worktree at this file's own commit with its own
    // `CARGO_TARGET_DIR`; each arm mutated ONE side, read the mutation
    // back with `git -C`, ran the crate's lib suite unpiped, restored and
    // proved the restoration by sha256.
    //
    //   is_symlink() alone        -> NOTHING reds. Shadowed: see layer 1.
    //   !meta.is_file() alone     -> 1 red, the directory body, ALONE.
    //   both link checks          -> 2 red, the directory and inside
    //                               bodies; `symlinks_are_never_followed_
    //                               file_or_dir` stays GREEN.
    //   starts_with alone         -> NOTHING reds. Shadowed: see layer 3.
    //   relative_posix's ok()?    -> 1 red, the predicate body, ALONE.
    //   all four together         -> 4 red, and only HERE does
    //                               `symlinks_are_never_followed_file_or_dir`
    //                               finally notice — which is the proof
    //                               that what it pins is containment.
    //   classification -> is_dir  -> 1 red, the inside body ALONE (the
    //                               count-1 mutant that answers poison
    //                               shape SIX for it: symlinks pass,
    //                               directories still skipped).
    //
    // **WHERE THIS CRATE PARTS COMPANY WITH `docs_watch.rs`, AND IT IS THE
    // REASON T-186 MEASURED INSTEAD OF INHERITING A VERDICT.** One crate
    // over, BOTH halves of the link classification are undetectable, and
    // that lane's honest landing was a body that cannot red. **The
    // inherited answer would have been WRONG HERE, and in the direction
    // that loses a test.**
    //
    // Only the `is_symlink()` half is undetectable here. `!meta.is_file()`
    // has a fixture of its own, and the reason is structural rather than
    // lucky: **layer 2 filters on the entry's own NAME, where the
    // collector filtered on a RESOLVED PATH.** So a directory called
    // `<name>.ts` — allowlisted extension, requested language,
    // canonicalizes to itself, formats to a relative path — clears every
    // remaining predicate and is emitted as a source file, which the
    // parser would then be handed to read. A directory in `docs_watch`'s
    // collector could never reach that far, so no such fixture exists
    // there and none could be written.
    //
    // The general form, for whoever meets the next sibling of this
    // finding: **two guards with identical TEXT are not the same guard.**
    // What decides whether a half is pinnable is what the predicates
    // DOWNSTREAM of it read — a name or a resolved path — and that is a
    // property of the surrounding walk, not of the line. Read the
    // downstream predicates before carrying any verdict across.
    //
    // The lifted arm TERMINATED IN A FIXTURE (CONVENTIONS, LIFTING A
    // SAFETY GUARD TO DISCRIMINATE — pointed at one, not merely started at
    // one): the only path leaked by the all-four arm is a `TempTree`
    // under the system temp dir, and the repository's own path appears in
    // that output zero times.
    //
    // **AND A WARNING FOR WHOEVER RE-RUNS THIS DRILL, BECAUSE IT COST THIS
    // LANE TWO FALSE GREENS** (CONVENTIONS, poison shape TEN — an empty
    // comparison reports AGREEMENT). Two of the checks written to VERIFY
    // the work above were themselves vacuous, and both looked like clean
    // passes:
    //
    //   - a `diff` proving this file's shipped half unchanged against base
    //     compared two EMPTY files and exited 0, because zsh's `:a`
    //     modifier had eaten `$ref:app/...` inside a `git show`;
    //   - a duplicate-card-id check ran over an EMPTY corpus, because
    //     `git ls-tree` emits full paths and the pattern was anchored at
    //     `^T-`.
    //
    // Neither failure is visible in an exit code: a check with nothing on
    // either side of it passes, loudly and wrongly. **The failure wears the
    // drill's own costume** — it is indistinguishable from the finished
    // job it is imitating. What caught both was mechanical and cheap:
    // **PRINT THE CORPUS SIZE BEFORE READING THE VERDICT, and run the check
    // once against a PLANTED positive so you have seen it fail.** Every
    // zero in this ledger was obtained that way; do the same to anything
    // you add to it.

    #[cfg(unix)]
    #[test]
    fn a_symlink_to_an_inside_file_is_refused_by_the_link_checks_alone() {
        // The fixture the body above cannot be: this link's target is
        // INSIDE the root, so canonicalization lands it squarely under
        // `canon_root` and BOTH containment layers pass it happily. Only
        // the link classification can refuse it. That takes the shadow
        // from four layers to two, which is the strongest body that can
        // exist here.
        //
        // **AND THE TARGET MUST BE A FILE THE WALK DOES NOT OTHERWISE
        // COLLECT, WHICH IS THE TRAP THIS CRATE ADDS.** Aim the link at an
        // allowlisted inside file instead — `alias.ts` -> `real.ts` — and
        // a lifted layer 1 pushes `real.ts` a SECOND time, where
        // `files.dedup_by(|a, b| a.rel == b.rel)` at the end of the walk
        // collapses it: byte-identical output, mutant survives, body
        // useless. That attempt was RUN before this one was written
        // (T-186's drill, arm B3) rather than reasoned away.
        //
        // The `.md` target is what makes the refusal observable, and it is
        // the truer statement besides: with layer 1 lifted the walk emits
        // `notes.md` TAGGED `Lang::Ts`, because layer 2 read the LINK's
        // name and layer 3 read the TARGET's path. A markdown file
        // indexed as TypeScript is the shape of the defect this guard
        // prevents.
        use std::os::unix::fs::symlink;
        let t = TempTree::new("walk-symlink-inside");
        t.write("real.ts", "export const r = 1;");
        t.write("notes.md", "# not a source file");
        let link = t.root().join("alias.ts");
        symlink(t.root().join("notes.md"), &link).expect("file symlink");

        // The guard's STATE before anything is exercised (CONVENTIONS,
        // LIFTING A SAFETY GUARD TO DISCRIMINATE). This is the fact the
        // whole shadowing argument at the site rests on, and it is the
        // OS's rather than ours: `symlink_metadata` describes the LINK.
        let meta = std::fs::symlink_metadata(&link).expect("lstat the link");
        assert!(meta.file_type().is_symlink(), "the fixture is not a link");
        assert!(!meta.is_file(), "lstat must not call a link a file");
        assert!(!meta.is_dir(), "lstat must not call a link a dir");

        assert_eq!(rels(t.root()), vec!["real.ts"]);

        // POSITIVE CONTROL, built the way the producer builds it — a real
        // `.ts` at the same name, in the same place, in the same tree.
        // Without it, "expected one path, got one path" is satisfied
        // equally by a walk that refused for the wrong reason and by one
        // that never reached `alias.ts` at all.
        std::fs::remove_file(&link).expect("rm link");
        t.write("alias.ts", "export const a = 1;");
        assert_eq!(rels(t.root()), vec!["alias.ts", "real.ts"]);
    }

    #[test]
    fn a_directory_named_like_a_source_file_is_refused_as_a_non_file() {
        // `!meta.is_file()` shadows `is_symlink()`, and it is easy to read
        // it as nothing BUT that shadow. It is not. It is the only refusal
        // between the emitted set and a DIRECTORY called `<name>.ts`:
        // every later predicate clears such an entry — the extension is
        // allowlisted, the language is requested, and a directory inside
        // the root canonicalizes to itself and formats to a relative path
        // — so with this one line lifted the walk hands a directory to the
        // parser as source. This body reds on that lift ALONE.
        let t = TempTree::new("walk-dir-named-like-source");
        t.write("real.ts", "export const r = 1;");
        t.write("weird.ts/inner.txt", "not source");

        // The guard's STATE before anything is exercised.
        let dir = t.root().join("weird.ts");
        let meta = std::fs::symlink_metadata(&dir).expect("lstat the dir");
        assert!(meta.is_dir(), "the fixture is not a directory");
        assert!(!meta.is_file(), "a directory is not a file");
        assert!(
            !meta.file_type().is_symlink(),
            "the fixture must not be a link — that would test layer 1"
        );

        assert_eq!(rels(t.root()), vec!["real.ts"]);

        // POSITIVE CONTROL, built the way the producer builds it: the same
        // name, in the same place, as a real file. The refusal is the
        // directory's, not the name's.
        std::fs::remove_dir_all(&dir).expect("rm dir");
        t.write("weird.ts", "export const w = 1;");
        assert_eq!(rels(t.root()), vec!["real.ts", "weird.ts"]);
    }

    #[test]
    fn relative_posix_is_the_containment_predicate_the_walk_relies_on() {
        // The walk's last containment layer, exercised where it IS the
        // whole behaviour. The `starts_with` above it cannot be poisoned
        // (the site comment says why), so without this body the `.ok()?`
        // that actually enforces containment once that line is lifted is
        // pinned by nothing at all. No walk-level fixture can reach it
        // while either link check stands.
        let base = Path::new("/tmp/proj");

        // Positive control first, and not merely `is_some()`: a contained
        // path formats to the exact relative POSIX string the walk then
        // sorts, dedups and emits.
        assert_eq!(
            relative_posix(Path::new("/tmp/proj/src/a.ts"), base),
            Some("src/a.ts".to_string())
        );
        assert_eq!(relative_posix(base, base), Some(String::new()));

        // The refusals, one per way out of the tree.
        assert_eq!(relative_posix(Path::new("/tmp/other/secret.ts"), base), None);
        assert_eq!(relative_posix(Path::new("/tmp"), base), None);
        // And the one a byte-prefix check gets WRONG — the reason both
        // containment layers are spelled with path primitives rather than
        // string ones: a sibling whose NAME starts with the project's is
        // not inside the project.
        assert_eq!(
            relative_posix(Path::new("/tmp/proj-evil/src/x.ts"), base),
            None
        );
    }
}
