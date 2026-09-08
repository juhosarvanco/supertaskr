//! T-167 (C-14): the ORGANIZATION'S SKILL PACKS, discovered in the OPENED
//! PROJECT at `.claude/skills/<name>/SKILL.md` and carried into the
//! genesis kickoff the way [`super::kit`] carries the method kit.
//!
//! THE SURFACE IS A RUNTIME PATH IN SOMEBODY ELSE'S FOLDER, never a
//! tracked path in this repository — the card's dated PREFLIGHT RULING
//! (2026-08-30) says so in as many words, and every fixture in this file
//! and in `tests/agent_runner.rs` plants into a temp directory. This
//! repository deliberately has no `.claude/skills/` and this module
//! creates none: **the directory is a READ surface** (the card's last
//! criterion), so nothing here writes, moves, or deletes anything under
//! it.
//!
//! WHY THE PLAYBOOK'S FORMAT VERBATIM: the room
//! (`docs/rooms/loop-customization.md`, design seed 1) rules that
//! *compatibility IS the import UX* — an org's existing skills drop into
//! a supertaskr project unchanged. So the required frontmatter set is exactly
//! what a real pack carries, `name` and `description`, and a pack that
//! carries more is not punished for it.
//!
//! WHERE THE TRIGGER CONDITIONS ARE: in this format the DESCRIPTION
//! states when the skill applies ("Use when …") — that is the mechanism,
//! not a gap. [`SkillPack::triggers`] therefore carries the description
//! unless the pack states an explicit `when:`, which is accepted and
//! never required. Requiring a separate trigger key would make every
//! genuine pack malformed, which is the one outcome the room's
//! compatibility ruling forbids.
//!
//! CONTAINMENT, the same posture the rest of this module keeps toward
//! file-borne data: every value that reaches a prompt or a log is
//! FLATTENED (no control characters, so a pack cannot forge a line in the
//! kickoff or the transcript) and CAPPED; the file is capped before it is
//! read; the pack count is capped; a symlinked entry is not followed, so
//! a pack cannot reach outside the project the CLI is scoped to.

use std::collections::BTreeMap;
use std::fs;
use std::path::{Path, PathBuf};

/// `.claude/skills`, relative to the OPENED PROJECT root (POSIX).
pub const SKILLS_REL_DIR: &str = ".claude/skills";

/// The file inside each pack directory.
pub const SKILL_FILE: &str = "SKILL.md";

/// Most bytes one `SKILL.md` may hold before it is reported and skipped.
/// A pack is policy prose; this is roomy for that and refuses a file that
/// is something else.
pub const MAX_SKILL_BYTES: u64 = 64 * 1024;

/// Most packs one genesis carries. The kickoff is ONE paragraph on a
/// child's stdin, so the clause it grows has to be bounded by something.
pub const MAX_PACKS: usize = 32;

/// Cap on a pack NAME as it reaches a prompt or a log.
pub const MAX_NAME_CHARS: usize = 64;

/// Cap on a pack DESCRIPTION as it reaches a prompt. The planner reads
/// the pack's own file for the rest — the prompt's job is to name it, the
/// way the kit's prompt names a kit root rather than inlining the method.
pub const MAX_DESCRIPTION_CHARS: usize = 300;

/// One discovered, well-formed pack.
#[derive(Clone, Debug, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillPack {
    /// The DIRECTORY name — `<name>` in `.claude/skills/<name>/SKILL.md`.
    /// Identity on disk, and what a rejection is reported by, because it
    /// exists even when nothing inside the directory parses.
    pub dir: String,
    /// The frontmatter `name`, flattened and capped.
    pub name: String,
    /// The frontmatter `description`, flattened and capped.
    pub description: String,
    /// WHEN this pack applies. The description unless the pack states an
    /// explicit `when:` — see this module's header for why the required
    /// set is two keys and not three.
    pub triggers: String,
    /// Project-relative POSIX path to the pack's own file.
    pub rel_path: String,
    /// `"sha256:" + 64 lowercase hex` over the RAW file bytes. The
    /// provenance half of the card's third criterion: "which policy
    /// shaped this decision" is answerable later from files alone.
    pub hash: String,
}

/// One pack that was REPORTED and SKIPPED — never a crash, never silently
/// absorbed (the card's first criterion).
#[derive(Clone, Debug, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillReject {
    /// The directory name, always available.
    pub dir: String,
    /// Why, in one flattened sentence fit for a log line.
    pub why: String,
}

/// What one discovery pass found.
#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub struct Discovered {
    /// Well-formed packs, ordered by directory name so two runs over one
    /// folder produce one kickoff and one stamp.
    pub packs: Vec<SkillPack>,
    /// Everything reported and skipped, in the same order.
    pub rejected: Vec<SkillReject>,
}

impl Discovered {
    /// Nothing found and nothing skipped — the no-packs case the card
    /// requires to be byte-identical to the behaviour before T-167.
    pub fn is_empty(&self) -> bool {
        self.packs.is_empty() && self.rejected.is_empty()
    }
}

/// `<project>/.claude/skills`.
pub fn skills_root(project_dir: &Path) -> PathBuf {
    let mut path = project_dir.to_path_buf();
    for part in SKILLS_REL_DIR.split('/') {
        path.push(part);
    }
    path
}

/// DISCOVER the packs in an opened project.
///
/// A folder with no `.claude/skills/` answers an empty [`Discovered`] and
/// never an error: no packs is the ordinary case, not a fault. Every
/// other failure — an unreadable file, an oversized file, bytes that are
/// not UTF-8, frontmatter that does not parse, a missing required key —
/// lands in [`Discovered::rejected`] named by its directory.
pub fn discover(project_dir: &Path) -> Discovered {
    let root = skills_root(project_dir);
    let mut out = Discovered::default();

    let Ok(entries) = fs::read_dir(&root) else {
        return out;
    };

    // read_dir order is the filesystem's, so EVERY answer below — loaded
    // and rejected alike — is emitted in sorted directory order: an
    // unordered kickoff would differ run to run over one unchanged folder.
    let mut candidates: Vec<(String, Result<PathBuf, String>)> = Vec::new();
    for entry in entries.flatten() {
        let name = entry.file_name().to_string_lossy().into_owned();
        if name.starts_with('.') {
            continue;
        }
        // `symlink_metadata` does NOT follow: a symlinked pack could point
        // anywhere on the machine, and the CLI this prompt briefs is
        // scoped to the project directory. Reported rather than skipped in
        // silence, because a user who symlinked one meant something by it.
        let Ok(meta) = entry.path().symlink_metadata() else {
            candidates.push((name, Err("the entry could not be read".to_string())));
            continue;
        };
        if meta.file_type().is_symlink() {
            candidates.push((
                name,
                Err(format!(
                    "symlinked entries are not followed - a pack must live inside the project, at {SKILLS_REL_DIR}/<name>/{SKILL_FILE}"
                )),
            ));
            continue;
        }
        if !meta.is_dir() {
            continue;
        }
        candidates.push((name, Ok(entry.path())));
    }
    candidates.sort_by(|a, b| a.0.cmp(&b.0));

    for (name, candidate) in candidates {
        let dir = flatten(&name, MAX_NAME_CHARS);
        let why = match candidate {
            Err(why) => why,
            Ok(_) if out.packs.len() >= MAX_PACKS => {
                format!("the limit of {MAX_PACKS} skill packs was already reached")
            }
            Ok(path) => match read_pack(&name, &path) {
                Ok(pack) => {
                    out.packs.push(pack);
                    continue;
                }
                Err(why) => why,
            },
        };
        out.rejected.push(SkillReject { dir, why: flatten(&why, 200) });
    }
    out
}

/// One directory -> one pack, or the sentence that says why not.
fn read_pack(dir_name: &str, dir: &Path) -> Result<SkillPack, String> {
    let file = dir.join(SKILL_FILE);
    let meta = fs::symlink_metadata(&file)
        .map_err(|err| format!("{SKILL_FILE} could not be read ({})", io_why(&err)))?;
    if meta.file_type().is_symlink() {
        return Err(format!("{SKILL_FILE} is a symlink and symlinks are not followed"));
    }
    if !meta.is_file() {
        return Err(format!("{SKILL_FILE} is not a regular file"));
    }
    if meta.len() > MAX_SKILL_BYTES {
        return Err(format!(
            "{SKILL_FILE} is {} bytes, over the {MAX_SKILL_BYTES}-byte cap",
            meta.len()
        ));
    }
    let bytes =
        fs::read(&file).map_err(|err| format!("{SKILL_FILE} could not be read ({})", io_why(&err)))?;
    let text = std::str::from_utf8(&bytes)
        .map_err(|_| format!("{SKILL_FILE} is not valid UTF-8"))?;

    let fields = parse_frontmatter(text)?;
    let name = required(&fields, "name")?;
    let description = required(&fields, "description")?;
    let triggers = fields
        .get("when")
        .map(|w| flatten(w, MAX_DESCRIPTION_CHARS))
        .filter(|w| !w.is_empty())
        .unwrap_or_else(|| description.clone());

    Ok(SkillPack {
        dir: flatten(dir_name, MAX_NAME_CHARS),
        name,
        description,
        triggers,
        rel_path: format!("{SKILLS_REL_DIR}/{dir_name}/{SKILL_FILE}"),
        hash: sha256_hex(&bytes),
    })
}

/// A required frontmatter key, flattened and capped, refused when absent
/// or empty.
fn required(fields: &BTreeMap<String, String>, key: &str) -> Result<String, String> {
    let cap = if key == "name" { MAX_NAME_CHARS } else { MAX_DESCRIPTION_CHARS };
    match fields.get(key).map(|v| flatten(v, cap)) {
        Some(value) if !value.is_empty() => Ok(value),
        Some(_) => Err(format!("its frontmatter `{key}:` is empty")),
        None => Err(format!("its frontmatter has no `{key}:`")),
    }
}

/// An `io::Error` reduced to one flattened clause — the kind, never the
/// OS string, which can carry a path the user did not ask us to print.
fn io_why(err: &std::io::Error) -> String {
    flatten(&format!("{:?}", err.kind()), 48)
}

/// EVERY value that leaves this module for a prompt, a log line or the
/// session registry goes through here.
///
/// Control characters become spaces (a pack must not be able to forge a
/// line break in a one-paragraph kickoff or a JSONL transcript), runs of
/// whitespace collapse to one, and the result is truncated on a CHARACTER
/// boundary — the same discipline `sessions::truncate_utf8` keeps for
/// registry values.
pub fn flatten(raw: &str, max_chars: usize) -> String {
    let mut out = String::new();
    let mut pending_space = false;
    for ch in raw.chars() {
        let ch = if ch.is_control() { ' ' } else { ch };
        if ch.is_whitespace() {
            pending_space = !out.is_empty();
            continue;
        }
        if out.chars().count() >= max_chars {
            return out;
        }
        if pending_space {
            if out.chars().count() + 1 >= max_chars {
                return out;
            }
            out.push(' ');
            pending_space = false;
        }
        out.push(ch);
    }
    out
}

/// The frontmatter block as a key -> value map.
///
/// A deliberately SMALL reader, not a YAML engine: the file must OPEN
/// with a `---` line and close with one, and between them a key is
/// `key: value` with an optional block indicator (`|`, `>`, and their
/// chomping forms) whose value arrives on the indented lines beneath it.
/// Surrounding quotes are stripped. Anything else in the block is a parse
/// failure, which is the honest answer — a pack whose policy we cannot
/// read is skipped, never guessed at.
fn parse_frontmatter(text: &str) -> Result<BTreeMap<String, String>, String> {
    let body = text.strip_prefix('\u{feff}').unwrap_or(text);
    let mut lines = body.lines();
    match lines.next().map(str::trim_end) {
        Some("---") => {}
        _ => {
            return Err(format!(
                "{SKILL_FILE} does not open with a `---` frontmatter line"
            ))
        }
    }

    let mut fields: BTreeMap<String, String> = BTreeMap::new();
    let mut current: Option<String> = None;
    let mut closed = false;
    for line in lines {
        let trimmed_end = line.trim_end();
        if trimmed_end == "---" || trimmed_end == "..." {
            closed = true;
            break;
        }
        if trimmed_end.trim().is_empty() {
            continue;
        }
        let indented = line.starts_with(' ') || line.starts_with('\t');
        if indented {
            // A continuation of the key above — the shape a folded or
            // literal block takes, and the shape a wrapped value takes.
            match current.as_ref().and_then(|key| fields.get_mut(key)) {
                Some(value) => {
                    if !value.is_empty() {
                        value.push(' ');
                    }
                    value.push_str(trimmed_end.trim());
                    continue;
                }
                None => {
                    return Err(format!(
                        "{SKILL_FILE}'s frontmatter has an indented line before any key"
                    ))
                }
            }
        }
        if trimmed_end.starts_with('#') {
            continue;
        }
        let Some((key, rest)) = trimmed_end.split_once(':') else {
            return Err(format!(
                "{SKILL_FILE}'s frontmatter has a line that is not `key: value`"
            ));
        };
        let key = key.trim();
        if key.is_empty()
            || !key.chars().all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '-')
        {
            return Err(format!(
                "{SKILL_FILE}'s frontmatter has a line that is not `key: value`"
            ));
        }
        let mut value = rest.trim().to_string();
        // Block indicators carry their value on the lines beneath.
        if matches!(value.as_str(), "|" | ">" | "|-" | ">-" | "|+" | ">+") {
            value.clear();
        }
        value = unquote(&value);
        fields.insert(key.to_ascii_lowercase(), value);
        current = Some(key.to_ascii_lowercase());
    }
    if !closed {
        return Err(format!("{SKILL_FILE}'s frontmatter block is never closed"));
    }
    Ok(fields)
}

/// Strip one layer of matching surrounding quotes.
fn unquote(value: &str) -> String {
    let bytes = value.as_bytes();
    if bytes.len() >= 2 {
        let first = bytes[0];
        let last = bytes[bytes.len() - 1];
        if (first == b'"' && last == b'"') || (first == b'\'' && last == b'\'') {
            return value[1..value.len() - 1].to_string();
        }
    }
    value.to_string()
}

// ---- the content hash --------------------------------------------------

/// `"sha256:" + 64 lowercase hex` over raw bytes.
///
/// **WHY HAND-ROLLED**, the same answer `sessions::iso8601_utc` gives for
/// having no `chrono`: this crate takes ZERO new dependencies, and the one
/// hash already in the workspace — `supertaskr-index`'s blake3 wrapper — is
/// `pub(crate)` inside a crate this fence does not reach, behind a
/// dependency this crate does not declare. Reaching either would edit
/// `app/src-tauri/Cargo.toml` or `crates/supertaskr-index/`, both outside
/// T-167's fence. SHA-256 is a fully specified function whose published
/// vectors pin it exactly, which is what
/// [`tests::sha256_matches_the_published_vectors`] does — an
/// implementation that is wrong is not subtly wrong, it fails the first
/// vector.
pub fn sha256_hex(data: &[u8]) -> String {
    const H0: [u32; 8] = [
        0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab,
        0x5be0cd19,
    ];
    #[rustfmt::skip]
    const K: [u32; 64] = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
    ];

    let mut h = H0;
    let bit_len = (data.len() as u64).wrapping_mul(8);
    let mut msg = Vec::with_capacity(data.len() + 72);
    msg.extend_from_slice(data);
    msg.push(0x80);
    while msg.len() % 64 != 56 {
        msg.push(0);
    }
    msg.extend_from_slice(&bit_len.to_be_bytes());

    for chunk in msg.chunks_exact(64) {
        let mut w = [0u32; 64];
        for (i, word) in w.iter_mut().take(16).enumerate() {
            *word = u32::from_be_bytes([
                chunk[4 * i],
                chunk[4 * i + 1],
                chunk[4 * i + 2],
                chunk[4 * i + 3],
            ]);
        }
        for i in 16..64 {
            let s0 = w[i - 15].rotate_right(7) ^ w[i - 15].rotate_right(18) ^ (w[i - 15] >> 3);
            let s1 = w[i - 2].rotate_right(17) ^ w[i - 2].rotate_right(19) ^ (w[i - 2] >> 10);
            w[i] = w[i - 16]
                .wrapping_add(s0)
                .wrapping_add(w[i - 7])
                .wrapping_add(s1);
        }
        let (mut a, mut b, mut c, mut d, mut e, mut f, mut g, mut hh) =
            (h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7]);
        for i in 0..64 {
            let s1 = e.rotate_right(6) ^ e.rotate_right(11) ^ e.rotate_right(25);
            let ch = (e & f) ^ ((!e) & g);
            let t1 = hh
                .wrapping_add(s1)
                .wrapping_add(ch)
                .wrapping_add(K[i])
                .wrapping_add(w[i]);
            let s0 = a.rotate_right(2) ^ a.rotate_right(13) ^ a.rotate_right(22);
            let maj = (a & b) ^ (a & c) ^ (b & c);
            let t2 = s0.wrapping_add(maj);
            hh = g;
            g = f;
            f = e;
            e = d.wrapping_add(t1);
            d = c;
            c = b;
            b = a;
            a = t1.wrapping_add(t2);
        }
        for (slot, add) in h.iter_mut().zip([a, b, c, d, e, f, g, hh]) {
            *slot = slot.wrapping_add(add);
        }
    }

    let mut out = String::with_capacity(7 + 64);
    out.push_str("sha256:");
    for word in h {
        for byte in word.to_be_bytes() {
            out.push(char::from_digit((byte >> 4) as u32, 16).expect("nibble"));
            out.push(char::from_digit((byte & 0x0f) as u32, 16).expect("nibble"));
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    struct TempTree(PathBuf);
    impl TempTree {
        fn new(tag: &str) -> Self {
            let dir = std::env::temp_dir().join(format!(
                "supertaskr-t167-skills-{}-{}-{}",
                tag,
                std::process::id(),
                std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .map(|d| d.as_nanos())
                    .unwrap_or(0)
            ));
            fs::create_dir_all(&dir).expect("mk temp");
            Self(dir)
        }
        /// Plant one pack into the RUNTIME surface of a temp project.
        fn pack(&self, name: &str, body: &str) {
            let dir = skills_root(&self.0).join(name);
            fs::create_dir_all(&dir).expect("mk pack dir");
            fs::write(dir.join(SKILL_FILE), body).expect("write pack");
        }
    }
    impl Drop for TempTree {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.0);
        }
    }

    const BRAND: &str = "---\nname: brand\ndescription: Brand voice and naming rules. Use when writing any user-facing copy.\n---\n\nAlways say supertaskr in lower case.\n";

    /// THE PUBLISHED VECTORS (FIPS 180-4 / the SHA-256 examples). A
    /// hand-rolled hash is only as good as the vectors that pin it, so all
    /// four sizes are here: empty, one block, one block with padding
    /// spillover, and a two-block message.
    #[test]
    fn sha256_matches_the_published_vectors() {
        assert_eq!(
            sha256_hex(b""),
            "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        );
        assert_eq!(
            sha256_hex(b"abc"),
            "sha256:ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
        );
        assert_eq!(
            sha256_hex(b"abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq"),
            "sha256:248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1"
        );
        assert_eq!(
            sha256_hex(
                b"abcdefghbcdefghicdefghijdefghijkefghijklfghijklmghijklmnhijklmnoijklmnopjklmnopqklmnopqrlmnopqrsmnopqrstnopqrstu"
            ),
            "sha256:cf5b16a778af8380036ce59e7b0492370b249b11e8f07a51afac45037afee9d1"
        );
        // Content-sensitive, and one byte is enough to move it.
        assert_ne!(sha256_hex(b"abc"), sha256_hex(b"abd"));
    }

    /// A FOLDER WITH NO PACKS answers empty and never an error — the
    /// no-packs case the card requires to be byte-identical to today.
    #[test]
    fn a_project_with_no_skills_directory_discovers_nothing() {
        let t = TempTree::new("nopacks");
        let found = discover(&t.0);
        assert!(found.is_empty(), "{found:?}");
        assert!(found.packs.is_empty());
        assert!(found.rejected.is_empty());
        // And an EMPTY `.claude/skills/` is the same answer.
        fs::create_dir_all(skills_root(&t.0)).expect("mk skills root");
        assert!(discover(&t.0).is_empty());
    }

    #[test]
    fn a_well_formed_pack_is_discovered_with_its_name_description_and_hash() {
        let t = TempTree::new("wellformed");
        t.pack("brand", BRAND);

        let found = discover(&t.0);
        assert!(found.rejected.is_empty(), "{:?}", found.rejected);
        assert_eq!(found.packs.len(), 1);
        let pack = &found.packs[0];
        assert_eq!(pack.dir, "brand");
        assert_eq!(pack.name, "brand");
        assert_eq!(
            pack.description,
            "Brand voice and naming rules. Use when writing any user-facing copy."
        );
        // No explicit `when:`, so the triggers ARE the description — the
        // format's own mechanism, stated in this module's header.
        assert_eq!(pack.triggers, pack.description);
        assert_eq!(pack.rel_path, ".claude/skills/brand/SKILL.md");
        assert_eq!(pack.hash, sha256_hex(BRAND.as_bytes()));
        assert!(pack.hash.starts_with("sha256:"));
        assert_eq!(pack.hash.len(), "sha256:".len() + 64);
    }

    /// THE HASH IS OVER THE WHOLE FILE, so an edit to the BODY — the
    /// guidance, which is the part that steers the planner — moves it.
    /// A hash over the frontmatter alone would answer the same for two
    /// packs with opposite policies.
    #[test]
    fn the_hash_moves_when_the_guidance_body_changes() {
        let t = TempTree::new("hashbody");
        t.pack("brand", BRAND);
        let before = discover(&t.0).packs[0].hash.clone();
        t.pack("brand", &BRAND.replace("lower case", "UPPER CASE"));
        let after = discover(&t.0).packs[0].hash.clone();
        assert_ne!(before, after, "the body is part of the provenance");
    }

    #[test]
    fn an_explicit_when_key_becomes_the_triggers_and_is_never_required() {
        let t = TempTree::new("when");
        t.pack(
            "security",
            "---\nname: security\ndescription: The security policy.\nwhen: Any change that touches authentication or secrets.\n---\nbody\n",
        );
        let found = discover(&t.0);
        assert!(found.rejected.is_empty(), "{:?}", found.rejected);
        assert_eq!(found.packs[0].triggers, "Any change that touches authentication or secrets.");
        assert_eq!(found.packs[0].description, "The security policy.");
    }

    /// EVERY MALFORMED SHAPE IS REPORTED BY NAME AND SKIPPED, and the
    /// well-formed sibling beside them is still loaded — the positive
    /// control that keeps "everything was rejected" from passing as
    /// "the malformed one was rejected".
    #[test]
    fn malformed_packs_are_reported_by_name_and_skipped() {
        let t = TempTree::new("malformed");
        t.pack("brand", BRAND);
        t.pack("no-frontmatter", "# Just a heading\n\nno frontmatter here\n");
        t.pack("unclosed", "---\nname: unclosed\ndescription: never closed\n");
        t.pack("no-name", "---\ndescription: has no name\n---\nbody\n");
        t.pack("no-description", "---\nname: lonely\n---\nbody\n");
        t.pack("empty-description", "---\nname: blank\ndescription: \"\"\n---\nbody\n");
        t.pack("not-key-value", "---\nname: odd\nthis line is not key value\n---\nbody\n");
        // A directory with no SKILL.md at all.
        fs::create_dir_all(skills_root(&t.0).join("empty-dir")).expect("mk empty dir");

        let found = discover(&t.0);
        assert_eq!(found.packs.len(), 1, "the good pack still loads: {:?}", found.packs);
        assert_eq!(found.packs[0].dir, "brand");

        let rejected: Vec<&str> = found.rejected.iter().map(|r| r.dir.as_str()).collect();
        assert_eq!(
            rejected,
            vec![
                "empty-description",
                "empty-dir",
                "no-description",
                "no-frontmatter",
                "no-name",
                "not-key-value",
                "unclosed",
            ],
            "every malformed pack is reported BY NAME, in directory order"
        );
        // The reasons are specific enough to act on, and none is empty.
        for reject in &found.rejected {
            assert!(!reject.why.is_empty(), "{reject:?} must say why");
            assert!(!reject.why.contains('\n'), "a reason is one flattened line");
        }
        let why = |dir: &str| {
            found.rejected.iter().find(|r| r.dir == dir).map(|r| r.why.clone()).unwrap_or_default()
        };
        assert!(
            why("no-frontmatter").contains("does not open with"),
            "the drill found this reason unpinned: {}",
            why("no-frontmatter")
        );
        assert!(why("no-name").contains("`name:`"), "{}", why("no-name"));
        assert!(why("no-description").contains("`description:`"), "{}", why("no-description"));
        assert!(why("empty-description").contains("empty"), "{}", why("empty-description"));
        assert!(why("unclosed").contains("never closed"), "{}", why("unclosed"));
        assert!(why("empty-dir").contains("SKILL.md"), "{}", why("empty-dir"));
    }

    /// A PACK CANNOT FORGE A LINE. The kickoff is one paragraph on a
    /// child's stdin and the transcript is JSONL; a description carrying
    /// newlines, tabs or a NUL must arrive as one flattened line.
    #[test]
    fn control_characters_in_a_pack_are_flattened_before_they_travel() {
        let t = TempTree::new("flatten");
        t.pack(
            "hostile",
            "---\nname: \"hos\ttile\"\ndescription: \"line one\u{0} and\tmore\"\n---\nbody\n",
        );
        let found = discover(&t.0);
        assert!(found.rejected.is_empty(), "{:?}", found.rejected);
        let pack = &found.packs[0];
        assert!(!pack.name.contains('\t') && !pack.name.contains('\n'));
        assert!(!pack.description.chars().any(char::is_control));
        assert_eq!(pack.name, "hos tile");

        // The flattener itself, on the cases the fixture cannot spell.
        assert_eq!(flatten("a\u{0}b", 64), "a b");
        assert_eq!(flatten("  spaced   out \n", 64), "spaced out");
        assert_eq!(flatten("", 64), "");
        assert_eq!(flatten("abcdef", 3), "abc");
        // Truncation is on a CHARACTER boundary, never a byte one.
        assert_eq!(flatten("émoji 🌍 tail", 3), "émo");
    }

    /// A folded/literal block value is read from the lines beneath it —
    /// the shape a long description takes in a real pack.
    #[test]
    fn a_folded_description_block_is_read_from_its_indented_lines() {
        let t = TempTree::new("folded");
        t.pack(
            "ux",
            "---\nname: ux\ndescription: >-\n  The UX policy for this organization.\n  Use when designing any screen.\n---\nbody\n",
        );
        let found = discover(&t.0);
        assert!(found.rejected.is_empty(), "{:?}", found.rejected);
        assert_eq!(
            found.packs[0].description,
            "The UX policy for this organization. Use when designing any screen."
        );
    }

    /// UNKNOWN KEYS ARE NOT A FAULT — compatibility is the import UX, and
    /// a real pack carries more than these two keys.
    #[test]
    fn a_pack_carrying_extra_frontmatter_keys_still_loads() {
        let t = TempTree::new("extrakeys");
        t.pack(
            "compliance",
            "---\nname: compliance\nlicense: proprietary\nallowed-tools: Read, Grep\ndescription: The compliance policy.\n---\nbody\n",
        );
        let found = discover(&t.0);
        assert!(found.rejected.is_empty(), "{:?}", found.rejected);
        assert_eq!(found.packs[0].name, "compliance");
    }

    #[test]
    fn an_oversized_pack_file_is_reported_and_skipped() {
        let t = TempTree::new("oversize");
        let mut huge = String::from("---\nname: huge\ndescription: too big\n---\n");
        huge.push_str(&"x".repeat(MAX_SKILL_BYTES as usize + 1));
        t.pack("huge", &huge);
        t.pack("brand", BRAND);

        let found = discover(&t.0);
        assert_eq!(found.packs.len(), 1);
        assert_eq!(found.packs[0].dir, "brand");
        assert_eq!(found.rejected.len(), 1);
        assert_eq!(found.rejected[0].dir, "huge");
        assert!(found.rejected[0].why.contains("cap"), "{:?}", found.rejected[0]);
    }

    /// DISCOVERY IS ORDERED, so two runs over one unchanged folder produce
    /// one kickoff and one stamp.
    #[test]
    fn discovery_is_sorted_by_directory_name_and_repeatable() {
        let t = TempTree::new("ordered");
        for name in ["zeta", "alpha", "mu"] {
            t.pack(name, &BRAND.replace("brand", name));
        }
        let first = discover(&t.0);
        let second = discover(&t.0);
        assert_eq!(
            first.packs.iter().map(|p| p.dir.as_str()).collect::<Vec<_>>(),
            vec!["alpha", "mu", "zeta"]
        );
        assert_eq!(first, second, "one folder, one answer");
    }

    #[test]
    fn the_pack_count_is_capped_and_the_overflow_is_reported() {
        let t = TempTree::new("cap");
        for i in 0..(MAX_PACKS + 3) {
            t.pack(&format!("pack-{i:03}"), &BRAND);
        }
        let found = discover(&t.0);
        assert_eq!(found.packs.len(), MAX_PACKS);
        assert_eq!(found.rejected.len(), 3);
        for reject in &found.rejected {
            assert!(reject.why.contains("limit"), "{reject:?}");
        }
    }

    /// A SYMLINKED PACK IS NOT FOLLOWED. The prompt this discovery feeds
    /// briefs a CLI scoped to the project directory; a symlink is the one
    /// way a pack could point outside it.
    #[cfg(unix)]
    #[test]
    fn a_symlinked_pack_is_reported_and_never_followed() {
        let t = TempTree::new("symlink");
        t.pack("brand", BRAND);
        // A real pack OUTSIDE the project, and a symlink to it inside.
        let outside = t.0.join("outside-the-project");
        fs::create_dir_all(&outside).expect("mk outside");
        fs::write(outside.join(SKILL_FILE), BRAND).expect("write outside");
        std::os::unix::fs::symlink(&outside, skills_root(&t.0).join("sneaky")).expect("symlink");

        let found = discover(&t.0);
        assert_eq!(
            found.packs.iter().map(|p| p.dir.as_str()).collect::<Vec<_>>(),
            vec!["brand"],
            "the symlinked pack must not be loaded"
        );
        assert_eq!(found.rejected.len(), 1);
        assert_eq!(found.rejected[0].dir, "sneaky");
        assert!(found.rejected[0].why.contains("symlink"), "{:?}", found.rejected[0]);
    }

    /// THE DIRECTORY IS A READ SURFACE (the card's last criterion):
    /// discovery leaves the tree it walked byte-for-byte as it found it.
    #[test]
    fn discovery_writes_nothing_into_the_skills_directory() {
        let t = TempTree::new("readonly");
        t.pack("brand", BRAND);
        let file = skills_root(&t.0).join("brand").join(SKILL_FILE);
        let before = fs::read(&file).expect("read before");

        discover(&t.0);
        discover(&t.0);

        assert_eq!(fs::read(&file).expect("read after"), before);
        let entries: Vec<String> = fs::read_dir(skills_root(&t.0).join("brand"))
            .expect("pack dir")
            .flatten()
            .map(|e| e.file_name().to_string_lossy().into_owned())
            .collect();
        assert_eq!(entries, vec![SKILL_FILE.to_string()], "nothing was written beside the pack");
    }
}
