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
        // Belt-and-suspenders beyond follow_links(false): our own
        // symlink_metadata check — a symlink (file or dir) is skipped
        // outright.
        let Ok(meta) = std::fs::symlink_metadata(path) else {
            continue;
        };
        if meta.file_type().is_symlink() || !meta.is_file() {
            continue;
        }
        let Some(ext) = path.extension().and_then(|e| e.to_str()) else {
            continue;
        };
        let Some(lang) = Lang::for_extension(ext) else {
            continue;
        };
        if !languages.contains(&lang) {
            continue;
        }
        // Canonical prefix check: anything escaping the root is dropped.
        let Ok(canon) = path.canonicalize() else {
            continue;
        };
        if !canon.starts_with(canon_root) {
            continue;
        }
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
        t.write("native.rs", "fn main() {}"); // not collected in T-009
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
        let canon = t.root().canonicalize().unwrap();
        let ts_only: Vec<String> = walk_root(&canon, &[Lang::Ts])
            .into_iter()
            .map(|f| f.rel)
            .collect();
        assert_eq!(ts_only, vec!["a.ts"]);
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
}
