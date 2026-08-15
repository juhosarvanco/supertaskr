//! blake3 wrappers: the per-file content hash and the cache-file key.

/// `"blake3:" + 64 lowercase hex` over raw file bytes (plan §4).
pub(crate) fn content_hash(bytes: &[u8]) -> String {
    format!("blake3:{}", blake3::hash(bytes).to_hex())
}

/// First 16 hex chars of blake3 over the canonical root string — the
/// cache file name for one indexed root (plan §4).
pub(crate) fn cache_key(canonical_root: &str) -> String {
    blake3::hash(canonical_root.as_bytes()).to_hex()[..16].to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn content_hash_is_prefixed_64_lowercase_hex() {
        let h = content_hash(b"hello");
        assert!(h.starts_with("blake3:"));
        let hex = &h["blake3:".len()..];
        assert_eq!(hex.len(), 64);
        assert!(hex.chars().all(|c| c.is_ascii_hexdigit() && !c.is_ascii_uppercase()));
        // Deterministic and content-sensitive.
        assert_eq!(h, content_hash(b"hello"));
        assert_ne!(h, content_hash(b"hello!"));
    }

    #[test]
    fn cache_key_is_16_hex_and_root_sensitive() {
        let a = cache_key("/repo/a");
        assert_eq!(a.len(), 16);
        assert_ne!(a, cache_key("/repo/b"));
    }
}
