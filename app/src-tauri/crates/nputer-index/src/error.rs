use std::fmt;
use std::path::PathBuf;

/// Errors that mean "this run cannot mean anything" (plan §2).
///
/// Per-file trouble — unreadable, non-UTF-8, oversize, syntax errors — is
/// NEVER an error: those files skip or degrade and are counted in `stats`,
/// because the indexer gets pointed at arbitrary (hostile) repos and the
/// criterion is "never drop, never fail the run".
#[non_exhaustive]
#[derive(Debug)]
pub enum IndexError {
    /// The root is missing, not a plain directory, or failed to canonicalize.
    RootInvalid(PathBuf),
    /// A tree-sitter language failed to load (fail fast, at startup).
    Grammar(&'static str),
    /// serde_json failure (structurally unreachable for these types).
    Serialize(String),
    /// Writing the graph file failed (`write_graph` target only).
    Write {
        path: PathBuf,
        source: std::io::Error,
    },
}

impl fmt::Display for IndexError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            IndexError::RootInvalid(path) => {
                write!(
                    f,
                    "index root {} is missing, not a plain directory, or cannot be canonicalized",
                    path.display()
                )
            }
            IndexError::Grammar(which) => {
                write!(f, "tree-sitter grammar failed to load: {which}")
            }
            IndexError::Serialize(msg) => write!(f, "graph serialization failed: {msg}"),
            IndexError::Write { path, source } => {
                write!(f, "cannot write graph to {}: {source}", path.display())
            }
        }
    }
}

impl std::error::Error for IndexError {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        match self {
            IndexError::Write { source, .. } => Some(source),
            _ => None,
        }
    }
}
