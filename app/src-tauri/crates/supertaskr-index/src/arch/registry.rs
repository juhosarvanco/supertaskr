//! The component registry, read narrowly.
//!
//! ADR-015 keeps ONE hardened frontmatter parser (@supertaskr/parser) so the
//! document FORMAT cannot fork. This reader is deliberately not a second
//! one: it reads a fixed, machine-shaped subset — `id`, `name`, `layer`,
//! `status`, `paths`, `depends_on` — of `docs/architecture/components/
//! C-*.md`, and it REFUSES rather than guesses. Anything it cannot read
//! exactly (an unterminated frontmatter block, a nested mapping, a
//! missing id/name/paths, a duplicate id) is an error naming the file,
//! and the caller exits "could not run" rather than reporting a drift
//! verdict derived from a registry it only half understood.
//!
//! That refusal is the whole safety argument: a second reader is
//! dangerous when it can quietly disagree, and this one cannot. It either
//! reads the same four facts the app reads, or it stops.
//!
//! Statuses are copied VERBATIM from the file. No status rollup, no
//! provenance rollup, no task join happens here or anywhere in this
//! crate — those are intent⨝tasks derivation and stay TypeScript's
//! (ADR-015).

use std::fmt;
use std::path::{Path, PathBuf};

/// Where the registry lives, relative to the repo root.
pub const REGISTRY_REL_DIR: &str = "docs/architecture/components";

/// One component's declared identity — the four fields the reality-side
/// join needs, plus the two the summary prints.
#[derive(Clone, Debug, PartialEq)]
pub struct Component {
    pub id: String,
    pub name: String,
    pub layer: String,
    /// Verbatim from the file; `auto` when the field is absent. NOT a
    /// rollup — this crate never joins tasks.
    pub status: String,
    pub paths: Vec<String>,
    pub depends_on: Vec<String>,
    /// The fence name a lane may spell instead of a path (T-135). Read
    /// from THIS file rather than from `docs/ARCHITECTURE.md`'s prose
    /// signpost, which that document says of itself is not the map
    /// (`T-089-s7`) — the field is authoritative where the two differ.
    /// Empty when the key is absent, and empty is a legitimate declared
    /// value (`C-01` writes `touch_slugs: []`). A slug is NOT unique to
    /// one component: `app-shell` names four of them.
    ///
    /// It is read with the SAME strictness as `depends_on:` — a bracketed
    /// shape this reader cannot parse exactly is a `Malformed` naming the
    /// file — which widens the refusal surface of `arch`, `arch drift`
    /// and `arch cycles` by one field. That is deliberate and it was
    /// measured before it was taken: all thirteen component files in this
    /// repository carry the inline-list form today, and a slug lookup
    /// answered out of a half-read list would send a lane to the wrong
    /// fence, which is the failure this reader exists to refuse.
    pub touch_slugs: Vec<String>,
    /// Repo-relative source file, for error messages.
    pub file: String,
}

#[derive(Clone, Debug, PartialEq)]
pub enum RegistryError {
    /// No `docs/architecture/components/` under the root.
    DirMissing(PathBuf),
    /// The directory holds no component files.
    Empty(PathBuf),
    /// One file could not be read exactly. `file` is repo-relative.
    Malformed { file: String, reason: String },
}

impl fmt::Display for RegistryError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            RegistryError::DirMissing(path) => write!(
                f,
                "no component registry at {} - this repo declares no architecture",
                path.display()
            ),
            RegistryError::Empty(path) => write!(
                f,
                "the component registry at {} holds no *.md files",
                path.display()
            ),
            RegistryError::Malformed { file, reason } => {
                write!(f, "{file}: {reason} (refusing to guess)")
            }
        }
    }
}

/// Numeric-aware component id order — `C-09` before `C-100`. Mirrors
/// @supertaskr/parser's `compareComponentIds` (lib/parser/src/component.ts),
/// which is what decides first-match-wins in the mapping.
pub fn compare_component_ids(a: &str, b: &str) -> std::cmp::Ordering {
    match (numeric_id(a), numeric_id(b)) {
        (Some(na), Some(nb)) if na != nb => na.cmp(&nb),
        _ => a.cmp(b),
    }
}

/// The digits of a `C-\d{2,}` id, or `None` for any other shape.
fn numeric_id(id: &str) -> Option<u64> {
    let digits = id.strip_prefix("C-")?;
    if digits.len() < 2 || !digits.bytes().all(|b| b.is_ascii_digit()) {
        return None;
    }
    digits.parse().ok()
}

/// Read every component file under `root`, sorted by numeric-aware id.
///
/// Containment (T-003 family, inherited): symlinked entries are skipped
/// outright — the registry is repo content and a link is not.
///
/// # TWO guards of identical text, and they classify DIFFERENTLY (T-194)
///
/// This function carries the shadowed-half shape TWICE — on the registry
/// DIRECTORY and on each ENTRY — written in the same words both times.
/// **They are not the same guard**, and the reading rule `T-140-s9` and
/// `T-186` left behind is why: what decides whether a half is separately
/// pinnable is what the predicates DOWNSTREAM read, which is a property of
/// the surrounding walk rather than of the line. Measured at this site
/// (`T-194`'s ledger), the two guards answer the question oppositely:
///
/// | guard | `is_symlink()` | the other half | smallest killer |
/// |---|---|---|---|
/// | D1, the directory | inert | inert (`read_dir` shadows it) | BOTH halves |
/// | D2, each entry | inert | **separately pinnable** | ONE half |
///
/// **Nothing here is deleted.** `T-140-s9`'s ruling stands: a provably
/// behaviour-neutral line on an ADR-010 boundary buys exactly zero
/// discrimination by leaving, and costs a visible containment statement.
/// The evidence is what changed.
///
/// Note that this reader has **no containment check at all** — no
/// `canonicalize`, no `starts_with`. That does NOT make D2's pair
/// observable where `walk_root`'s is not; `T-186` landed a body for
/// `walk_root`'s pair too. What it changes is which FIXTURES work: over
/// there only an INSIDE-pointing link can pin the pair, because
/// `starts_with(canon_root)` refuses an outside one before the
/// classification is reached — the defect `T-186` and `T-140-s9` both
/// found. Here either target works, so a fixture-terminating link into a
/// second `TempTree` is enough, and that is what
/// `a_symlinked_component_file_is_skipped_and_never_read_through` uses.
pub fn read_registry(root: &Path) -> Result<Vec<Component>, RegistryError> {
    let dir = root.join(REGISTRY_REL_DIR);
    let Ok(meta) = std::fs::symlink_metadata(&dir) else {
        return Err(RegistryError::DirMissing(dir));
    };
    // GUARD D1, on the registry directory itself. BOTH halves are inert
    // and they are inert for DIFFERENT reasons — the distinction is the
    // whole point of naming them separately:
    //   * `is_symlink()` is shadowed BY ITS OWN SIBLING. `meta` is from
    //     lstat, under which a link is neither file nor dir, so
    //     `!meta.is_dir()` refuses every link on its own.
    //   * `!meta.is_dir()` is shadowed DOWNSTREAM, by `read_dir` three
    //     lines below: every non-dir, non-symlink type it could catch
    //     (regular file, fifo, socket, device) makes `read_dir` fail, and
    //     that failure returns the SAME `DirMissing`. Measured: lifting it
    //     alone leaves the whole crate suite green.
    // The PAIR is load-bearing and nothing else is: with both lifted,
    // `read_dir` FOLLOWS a symlinked registry directory and this reader
    // reports components that are not repo content. That joint refusal is
    // what `a_registry_directory_that_is_a_symlink_is_refused_not_followed`
    // (`tests/arch.rs`) pins — the pair, not the half it is named for.
    if meta.file_type().is_symlink() || !meta.is_dir() {
        return Err(RegistryError::DirMissing(dir));
    }
    let Ok(entries) = std::fs::read_dir(&dir) else {
        return Err(RegistryError::DirMissing(dir));
    };

    // Collect then sort: the filesystem's order is never trusted.
    let mut files: Vec<PathBuf> = Vec::new();
    for entry in entries.flatten() {
        let path = entry.path();
        let Ok(meta) = std::fs::symlink_metadata(&path) else {
            continue;
        };
        // GUARD D2, on each entry — SAME TEXT AS D1, DIFFERENT ANSWER.
        //   * `is_symlink()` is inert here too, and for the same
        //     construction: lstat makes `!meta.is_file()` refuse every
        //     link. No fixture can separate them.
        //   * `!meta.is_file()` is **SEPARATELY PINNABLE**, and this is the
        //     half `T-140-s9`'s sweep and `T-186`'s route both passed over.
        //     The only later predicate is `path.extension()`, which reads
        //     the entry's own NAME rather than a resolved path — so a
        //     DIRECTORY called `C-99.md` clears it, is pushed into `files`,
        //     and `std::fs::read` below turns it into a `Malformed`
        //     ("unreadable") where the guard yields a silent skip. That is
        //     an observable, and it is
        //     `a_directory_wearing_a_component_files_name_is_skipped`.
        //     It is the SAME mechanism `T-186` found in `walk_root` and it
        //     is present here for the same reason — a name-shaped filter
        //     downstream of a type-shaped one.
        // The PAIR is load-bearing beyond either half: with both lifted a
        // symlink named `C-99.md` is READ THROUGH, and no containment check
        // exists in this function to catch it.
        if meta.file_type().is_symlink() || !meta.is_file() {
            continue;
        }
        if path.extension().and_then(|e| e.to_str()) == Some("md") {
            files.push(path);
        }
    }
    files.sort();
    if files.is_empty() {
        return Err(RegistryError::Empty(dir));
    }

    let mut components: Vec<Component> = Vec::new();
    for path in files {
        let rel = format!(
            "{REGISTRY_REL_DIR}/{}",
            path.file_name().and_then(|n| n.to_str()).unwrap_or("?")
        );
        let bytes = std::fs::read(&path).map_err(|err| RegistryError::Malformed {
            file: rel.clone(),
            reason: format!("unreadable ({err})"),
        })?;
        let text = String::from_utf8(bytes).map_err(|_| RegistryError::Malformed {
            file: rel.clone(),
            reason: "not UTF-8".to_string(),
        })?;
        components.push(parse_component(&text, &rel)?);
    }

    components.sort_by(|a, b| compare_component_ids(&a.id, &b.id));
    for pair in components.windows(2) {
        if pair[0].id == pair[1].id {
            return Err(RegistryError::Malformed {
                file: pair[1].file.clone(),
                reason: format!("duplicate component id {} (also in {})", pair[1].id, pair[0].file),
            });
        }
    }
    Ok(components)
}

/// Parse one component file's frontmatter. Total: every failure is a
/// `Malformed` naming the file and the reason.
pub fn parse_component(text: &str, file: &str) -> Result<Component, RegistryError> {
    let bad = |reason: String| RegistryError::Malformed {
        file: file.to_string(),
        reason,
    };

    let body = text.strip_prefix('\u{feff}').unwrap_or(text);
    let mut lines = body.lines();
    if lines.next().map(str::trim_end) != Some("---") {
        return Err(bad("no frontmatter block (file does not start with ---)".into()));
    }

    let mut id: Option<String> = None;
    let mut name: Option<String> = None;
    let mut layer = String::new();
    let mut status: Option<String> = None;
    let mut paths: Option<Vec<String>> = None;
    let mut depends_on: Vec<String> = Vec::new();
    let mut touch_slugs: Vec<String> = Vec::new();
    let mut current_list: Option<&'static str> = None;
    let mut closed = false;

    for raw in lines {
        let line = raw.trim_end();
        if line.trim() == "---" {
            closed = true;
            break;
        }
        if line.trim().is_empty() || line.trim_start().starts_with('#') {
            continue;
        }
        // A `- item` continuation belongs to the key most recently seen.
        if let Some(item) = line.trim_start().strip_prefix("- ") {
            let value = unquote(strip_comment(item).trim());
            match current_list {
                Some("paths") => paths.get_or_insert_with(Vec::new).push(value.to_string()),
                Some("depends_on") => depends_on.push(value.to_string()),
                Some("touch_slugs") => touch_slugs.push(value.to_string()),
                Some(_) => {} // a list under a key this reader ignores
                None => return Err(bad(format!("list item outside any key: {line:?}"))),
            }
            continue;
        }
        // Anything else must be a top-level `key:` at column 0. An
        // indented mapping is a shape this reader does not understand,
        // and understanding it half-way is exactly what it refuses.
        if line.starts_with(char::is_whitespace) {
            return Err(bad(format!("indented mapping is not supported: {line:?}")));
        }
        let Some((key, rest)) = line.split_once(':') else {
            return Err(bad(format!("not a `key: value` line: {line:?}")));
        };
        let key = key.trim();
        // Strip before trimming: a comment is introduced by " #", and the
        // registry writes `paths:                    # umbrella only`.
        let value = strip_comment(rest).trim();
        current_list = match key {
            "paths" => Some("paths"),
            "depends_on" => Some("depends_on"),
            "touch_slugs" => Some("touch_slugs"),
            _ => Some("other"),
        };
        if value.is_empty() {
            // A bare `key:` opens a block list (or is an empty scalar).
            continue;
        }
        current_list = None;
        match key {
            "id" => id = Some(unquote(value).to_string()),
            "name" => name = Some(unquote(value).to_string()),
            "layer" => layer = unquote(value).to_string(),
            "status" => status = Some(unquote(value).to_string()),
            "paths" => paths = Some(parse_inline_list(value, file)?),
            "depends_on" => depends_on = parse_inline_list(value, file)?,
            "touch_slugs" => touch_slugs = parse_inline_list(value, file)?,
            _ => {}
        }
    }
    if !closed {
        return Err(bad("frontmatter block is never closed by a --- line".into()));
    }

    let id = id.ok_or_else(|| bad("no `id:` field".into()))?;
    if numeric_id(&id).is_none() {
        return Err(bad(format!("id {id:?} is not of the form C-<two or more digits>")));
    }
    let name = name.filter(|n| !n.is_empty()).ok_or_else(|| bad("no `name:` field".into()))?;
    let paths = paths.ok_or_else(|| bad("no `paths:` field".into()))?;

    Ok(Component {
        id,
        name,
        layer,
        status: status.unwrap_or_else(|| "auto".to_string()),
        paths,
        depends_on,
        touch_slugs,
        file: file.to_string(),
    })
}

/// `[a, b]` -> `["a", "b"]`; `[]` -> empty. Any other bracketed shape is
/// refused rather than guessed at.
fn parse_inline_list(value: &str, file: &str) -> Result<Vec<String>, RegistryError> {
    let Some(inner) = value.strip_prefix('[').and_then(|v| v.strip_suffix(']')) else {
        return Err(RegistryError::Malformed {
            file: file.to_string(),
            reason: format!("expected a list, got {value:?}"),
        });
    };
    Ok(inner
        .split(',')
        .map(|item| unquote(item.trim()).to_string())
        .filter(|item| !item.is_empty())
        .collect())
}

/// Drop a trailing ` # comment`. Only ` #` (space then hash) counts, and
/// only outside a quoted scalar — the registry writes
/// `status: done              # pinned: …` and the comment must not
/// become part of the value.
fn strip_comment(value: &str) -> &str {
    let head = value.trim_start();
    if head.starts_with('"') || head.starts_with('\'') {
        return value;
    }
    match value.find(" #") {
        Some(at) => &value[..at],
        None => value,
    }
}

fn unquote(value: &str) -> &str {
    let value = value.trim();
    for quote in ['"', '\''] {
        if value.len() >= 2 && value.starts_with(quote) && value.ends_with(quote) {
            return &value[1..value.len() - 1];
        }
    }
    value
}

#[cfg(test)]
mod tests {
    use super::*;

    const GOOD: &str = "---\n\
id: C-05\n\
name: App\n\
layer: app                # the shell\n\
paths:                    # umbrella only\n\
  - app/index.html\n\
  - app/test/**\n\
depends_on: [C-06, C-11]\n\
decisions: [ADR-008]\n\
status: auto\n\
touch_slugs: [app-shell]\n\
---\n\
Prose below the block is not read.\n";

    #[test]
    fn reads_exactly_the_six_fields_and_ignores_the_rest() {
        let c = parse_component(GOOD, "C-05-app.md").unwrap();
        assert_eq!(c.id, "C-05");
        assert_eq!(c.name, "App");
        assert_eq!(c.layer, "app", "trailing comment stripped");
        assert_eq!(c.status, "auto");
        assert_eq!(c.paths, vec!["app/index.html", "app/test/**"]);
        assert_eq!(c.depends_on, vec!["C-06", "C-11"]);
    }

    #[test]
    fn status_defaults_to_auto_and_empty_lists_parse() {
        let text = "---\nid: C-07\nname: supertaskr-index\npaths:\n  - crates/**\ndepends_on: []\n---\n";
        let c = parse_component(text, "C-07.md").unwrap();
        assert_eq!(c.status, "auto");
        assert!(c.depends_on.is_empty());
        assert_eq!(c.layer, "");
    }

    #[test]
    fn a_pinned_status_with_a_comment_survives_verbatim() {
        let text = "---\nid: C-01\nname: method\npaths:\n  - method/**\nstatus: done              # pinned: built\n---\n";
        assert_eq!(parse_component(text, "C-01.md").unwrap().status, "done");
    }

    #[test]
    fn every_shape_it_cannot_read_exactly_is_refused_by_name() {
        let cases: [(&str, &str); 7] = [
            ("no frontmatter", "id: C-05\n"),
            ("unterminated", "---\nid: C-05\nname: App\npaths: []\n"),
            ("no id", "---\nname: App\npaths: []\n---\n"),
            ("bad id", "---\nid: C-5\nname: App\npaths: []\n---\n"),
            ("no name", "---\nid: C-05\npaths: []\n---\n"),
            ("no paths", "---\nid: C-05\nname: App\n---\n"),
            (
                "nested mapping",
                "---\nid: C-05\nname: App\npaths: []\nmeta:\n  nested: 1\n---\n",
            ),
        ];
        for (label, text) in cases {
            let err = parse_component(text, "x.md").unwrap_err();
            assert!(
                matches!(err, RegistryError::Malformed { .. }),
                "{label} must refuse, got {err:?}"
            );
            assert!(
                format!("{err}").contains("refusing to guess"),
                "{label}: {err}"
            );
        }
    }

    #[test]
    fn numeric_id_order_beats_lexical_order() {
        let mut ids = vec!["C-100", "C-09", "C-10", "C-05"];
        ids.sort_by(|a, b| compare_component_ids(a, b));
        assert_eq!(ids, vec!["C-05", "C-09", "C-10", "C-100"]);
    }

    #[test]
    fn a_list_item_with_no_key_above_it_is_refused() {
        let text = "---\n  - stray\nid: C-05\nname: App\npaths: []\n---\n";
        assert!(parse_component(text, "x.md").is_err());
    }

    #[test]
    fn reads_this_repos_live_registry_and_finds_the_known_shape() {
        // Content-independent: the registry is live and grows, so assert
        // its SHAPE (every id well-formed, sorted, paths non-empty for
        // the umbrella) rather than a count that a sibling task moves.
        let root = crate::testutil::repo_root();
        let components = read_registry(&root).expect("the live registry must read");
        assert!(components.len() >= 5, "dogfood registry has >= 5 components");
        let ids: Vec<&str> = components.iter().map(|c| c.id.as_str()).collect();
        let mut sorted = ids.clone();
        sorted.sort_by(|a, b| compare_component_ids(a, b));
        assert_eq!(ids, sorted, "returned in numeric id order");
        let c07 = components
            .iter()
            .find(|c| c.id == "C-07")
            .expect("C-07 declares this crate");
        assert!(c07
            .paths
            .iter()
            .any(|p| p.contains("crates/supertaskr-index")));
    }

    #[test]
    fn a_missing_registry_is_an_error_not_an_empty_answer() {
        let t = crate::testutil::TempTree::new("registry-missing");
        assert!(matches!(
            read_registry(t.root()),
            Err(RegistryError::DirMissing(_))
        ));
    }

    /// The smallest component file this reader accepts — `id`, `name` and
    /// `paths` are the three it refuses without.
    fn minimal(id: &str) -> String {
        format!("---\nid: {id}\nname: {id} component\npaths: []\n---\n")
    }

    /// Guard D2's `!meta.is_file()` half, pinned **ALONE**.
    ///
    /// This is the body `T-140-s9`'s sweep and `T-186`'s route both said
    /// did not exist here, and it exists for the reason `T-186` found one
    /// crate over: the only predicate downstream of the type check reads
    /// the entry's own NAME (`path.extension()`), so a DIRECTORY called
    /// `C-99*.md` clears it. With `!meta.is_file()` lifted the directory is
    /// pushed into `files` and `std::fs::read` fails on it, turning a
    /// silent skip into a `Malformed` that names the file.
    ///
    /// **Do NOT reason from `read_contained`'s twin of this guard, which
    /// this same card measured as unpinnable** (`resolve/mod.rs`): there
    /// the next thing to touch the path is `read_to_string`, whose own
    /// failure on a directory reproduces the guard's `None`. Identical
    /// text, opposite answer, and the difference is entirely downstream.
    #[test]
    fn a_directory_wearing_a_component_files_name_is_skipped() {
        let t = crate::testutil::TempTree::new("registry-dir-entry");
        t.write(
            &format!("{REGISTRY_REL_DIR}/C-01-real.md"),
            &minimal("C-01"),
        );
        std::fs::create_dir_all(t.root().join(REGISTRY_REL_DIR).join("C-99-fake.md"))
            .expect("mkdir the impostor");

        // POSITIVE CONTROL, built the way the producer builds it: a real
        // `.md` file in the SAME directory must be collected, or "one
        // component came back" is satisfied by a walk that never reached
        // the impostor at all.
        let components = read_registry(t.root()).expect("the registry must read");
        let ids: Vec<&str> = components.iter().map(|c| c.id.as_str()).collect();
        assert_eq!(
            ids,
            vec!["C-01"],
            "the real component is collected and the directory is skipped in silence"
        );
    }

    /// Guard D2's two halves pinned **JOINTLY** — the smallest killer is a
    /// two-side lift, which is a measured property of the code and not a
    /// weakness of this fixture (`T-194`): under lstat each half refuses a
    /// link on its own, so neither single lift reaches this body.
    ///
    /// The link's target is a second `TempTree` — a FIXTURE, deliberately,
    /// per `docs/CONVENTIONS.md`'s LIFTING A SAFETY GUARD TO DISCRIMINATE:
    /// the lifted arm must terminate in one, and `read_registry` has no
    /// containment check to stop it landing anywhere else.
    #[cfg(unix)]
    #[test]
    fn a_symlinked_component_file_is_skipped_and_never_read_through() {
        use std::os::unix::fs::symlink;
        let t = crate::testutil::TempTree::new("registry-link-entry");
        let outside = crate::testutil::TempTree::new("registry-link-target");
        t.write(
            &format!("{REGISTRY_REL_DIR}/C-01-real.md"),
            &minimal("C-01"),
        );
        outside.write("C-99-linked.md", &minimal("C-99"));

        // POSITIVE CONTROL: the link's TARGET is a component file this
        // reader would accept. Without it, "C-99 did not appear" is
        // satisfied by a target this parser would have refused anyway.
        assert_eq!(
            parse_component(&minimal("C-99"), "C-99-linked.md")
                .expect("control: the target parses")
                .id,
            "C-99",
            "control: the link's target is a component this reader accepts"
        );

        let link = t.root().join(REGISTRY_REL_DIR).join("C-99-linked.md");
        symlink(outside.root().join("C-99-linked.md"), &link).expect("symlink");
        // Assert the fixture's STATE before exercising it: a copy here
        // would make the body pass while testing nothing.
        assert!(
            std::fs::symlink_metadata(&link)
                .expect("stat the link")
                .file_type()
                .is_symlink(),
            "the fixture is not a link"
        );

        let components = read_registry(t.root()).expect("the registry must read");
        let ids: Vec<&str> = components.iter().map(|c| c.id.as_str()).collect();
        assert_eq!(
            ids,
            vec!["C-01"],
            "the registry is repo content; a link into another tree is not"
        );
    }
}
