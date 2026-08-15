//! Disposable parse cache (plan §4).
//!
//! One JSON file per indexed root: `<cache_dir>/<blake3(canonical root
//! string)[..16]>.json`. The caller supplies `cache_dir` (the app will
//! pass its app-data dir in T-012, the binary an XDG cache dir in T-014;
//! `None` = no cache) — the crate never invents a location.
//!
//! Disposable by contract (ADR-014: the committed graph.json is the
//! truth): deleting it must only cost a full re-parse, pinned by the
//! cold-vs-warm byte-equality test. Cache errors degrade silently to
//! uncached; the cache can never change output bytes, only timing.

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};

use crate::extract::ExtractRecord;
use crate::hash;

pub(crate) const CACHE_SCHEMA: u32 = 1;

#[derive(Clone, Debug, Default, PartialEq, Serialize, Deserialize)]
pub(crate) struct CacheFile {
    pub cache_schema: u32,
    pub indexer_version: String,
    pub files: BTreeMap<String, CacheEntry>,
}

/// Per-file pre-resolution result. Resolution is global and always
/// re-runs (cross-file by nature, cheap in-memory).
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub(crate) struct CacheEntry {
    pub hash: String,
    pub loc: usize,
    pub extract: ExtractRecord,
}

pub(crate) fn cache_file_path(cache_dir: &Path, canonical_root: &Path) -> PathBuf {
    let key = hash::cache_key(&canonical_root.display().to_string());
    cache_dir.join(format!("{key}.json"))
}

/// Load a cache file; missing, unreadable, corrupt, or from a different
/// cache schema / indexer version -> empty cache (whole-cache discard).
pub(crate) fn load(path: &Path) -> CacheFile {
    let Ok(bytes) = std::fs::read(path) else {
        return CacheFile::default();
    };
    let Ok(parsed) = serde_json::from_slice::<CacheFile>(&bytes) else {
        return CacheFile::default();
    };
    if parsed.cache_schema != CACHE_SCHEMA || parsed.indexer_version != env!("CARGO_PKG_VERSION") {
        return CacheFile::default();
    }
    parsed
}

/// The per-file re-parse decision: reuse only on byte-identical content
/// (hash match). Files absent from the walk simply never get looked up —
/// and `store` writes the current walk's entries only, so dead entries
/// drop out on the next write.
pub(crate) fn reusable<'c>(cache: &'c CacheFile, rel: &str, hash: &str) -> Option<&'c CacheEntry> {
    cache.files.get(rel).filter(|entry| entry.hash == hash)
}

/// Write atomically (temp file + rename, same dir). All failures are
/// silent — the cache is an accelerator, never a truth.
pub(crate) fn store(path: &Path, files: BTreeMap<String, CacheEntry>) {
    let cache = CacheFile {
        cache_schema: CACHE_SCHEMA,
        indexer_version: env!("CARGO_PKG_VERSION").to_string(),
        files,
    };
    let Ok(bytes) = serde_json::to_vec(&cache) else {
        return;
    };
    let Some(parent) = path.parent() else { return };
    if std::fs::create_dir_all(parent).is_err() {
        return;
    }
    let Some(name) = path.file_name().and_then(|n| n.to_str()) else {
        return;
    };
    let tmp = path.with_file_name(format!(".{name}.tmp-{}", std::process::id()));
    if std::fs::write(&tmp, &bytes).is_err() {
        let _ = std::fs::remove_file(&tmp);
        return;
    }
    if std::fs::rename(&tmp, path).is_err() {
        let _ = std::fs::remove_file(&tmp);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::extract::RawSymbol;
    use crate::testutil::TempTree;

    fn entry(hash: &str) -> CacheEntry {
        CacheEntry {
            hash: hash.to_string(),
            loc: 1,
            extract: ExtractRecord {
                symbols: vec![RawSymbol {
                    name: "a".into(),
                    kind: "const".into(),
                    exported: true,
                    range: [1, 1],
                }],
                ..Default::default()
            },
        }
    }

    fn store_and_path(t: &TempTree, files: BTreeMap<String, CacheEntry>) -> PathBuf {
        let path = cache_file_path(&t.root().join("cache"), &t.root().join("repo"));
        store(&path, files);
        path
    }

    #[test]
    fn round_trip_and_per_file_reuse_decision() {
        let t = TempTree::new("cache-rt");
        let mut files = BTreeMap::new();
        files.insert("a.ts".to_string(), entry("blake3:aa"));
        files.insert("b.ts".to_string(), entry("blake3:bb"));
        let path = store_and_path(&t, files);

        let loaded = load(&path);
        assert_eq!(loaded.files.len(), 2);
        // Hash match -> reuse; mismatch -> re-parse that file only;
        // unknown path -> re-parse.
        assert!(reusable(&loaded, "a.ts", "blake3:aa").is_some());
        assert!(reusable(&loaded, "a.ts", "blake3:CHANGED").is_none());
        assert!(reusable(&loaded, "new.ts", "blake3:aa").is_none());
        assert!(reusable(&loaded, "b.ts", "blake3:bb").is_some());
    }

    #[test]
    fn schema_and_version_mismatches_discard_the_whole_cache() {
        let t = TempTree::new("cache-schema");
        let mut files = BTreeMap::new();
        files.insert("a.ts".to_string(), entry("blake3:aa"));
        let path = store_and_path(&t, files);

        // Tamper: wrong cache_schema.
        let mut raw: serde_json::Value =
            serde_json::from_slice(&std::fs::read(&path).unwrap()).unwrap();
        raw["cache_schema"] = serde_json::json!(999);
        std::fs::write(&path, serde_json::to_vec(&raw).unwrap()).unwrap();
        assert_eq!(load(&path), CacheFile::default());

        // Tamper: different indexer version.
        raw["cache_schema"] = serde_json::json!(CACHE_SCHEMA);
        raw["indexer_version"] = serde_json::json!("0.0.0-other");
        std::fs::write(&path, serde_json::to_vec(&raw).unwrap()).unwrap();
        assert_eq!(load(&path), CacheFile::default());
    }

    #[test]
    fn corrupt_or_missing_cache_degrades_to_empty() {
        let t = TempTree::new("cache-corrupt");
        let path = t.root().join("cache").join("x.json");
        assert_eq!(load(&path), CacheFile::default()); // missing
        std::fs::create_dir_all(path.parent().unwrap()).unwrap();
        std::fs::write(&path, b"{ not json !!!").unwrap();
        assert_eq!(load(&path), CacheFile::default()); // corrupt
    }

    #[test]
    fn store_writes_current_walk_only_dropping_dead_entries() {
        let t = TempTree::new("cache-drop");
        let mut files = BTreeMap::new();
        files.insert("a.ts".to_string(), entry("blake3:aa"));
        files.insert("deleted.ts".to_string(), entry("blake3:dd"));
        let path = store_and_path(&t, files);

        // Next run walked only a.ts: the rewrite drops deleted.ts.
        let mut current = BTreeMap::new();
        current.insert("a.ts".to_string(), entry("blake3:aa"));
        store(&path, current);
        let loaded = load(&path);
        assert!(loaded.files.contains_key("a.ts"));
        assert!(!loaded.files.contains_key("deleted.ts"));
    }

    #[test]
    fn cache_file_path_is_root_keyed() {
        let dir = Path::new("/tmp/cache");
        let a = cache_file_path(dir, Path::new("/repo/a"));
        let b = cache_file_path(dir, Path::new("/repo/b"));
        assert_ne!(a, b);
        assert!(a.to_string_lossy().ends_with(".json"));
    }

    #[test]
    fn store_leaves_no_temp_files_behind() {
        let t = TempTree::new("cache-atomic");
        let mut files = BTreeMap::new();
        files.insert("a.ts".to_string(), entry("blake3:aa"));
        let path = store_and_path(&t, files);
        let entries: Vec<_> = std::fs::read_dir(path.parent().unwrap())
            .unwrap()
            .map(|e| e.unwrap().file_name().to_string_lossy().into_owned())
            .collect();
        assert_eq!(entries.len(), 1, "only the cache file: {entries:?}");
        assert!(!entries[0].contains("tmp"));
    }
}
