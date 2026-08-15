//! tree-sitter setup + grammar-per-dialect selection (plan §5).
//!
//! Grammar selection: `.ts/.mts/.cts` -> TYPESCRIPT; `.tsx` -> TSX;
//! `.js/.jsx` -> JAVASCRIPT (its grammar includes JSX). Languages are
//! loaded once at `index()` start; a load failure is
//! `IndexError::Grammar` (fail fast, not per file).

use tree_sitter::{Parser, Tree};

use crate::error::IndexError;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub(crate) enum Dialect {
    Ts,
    Tsx,
    Js,
}

/// Dialect by file extension (rel path). Callers only pass allowlisted
/// paths, so `None` never happens in the pipeline.
pub(crate) fn dialect_for(rel: &str) -> Option<Dialect> {
    let ext = rel.rsplit('.').next()?;
    match ext {
        "ts" | "mts" | "cts" => Some(Dialect::Ts),
        "tsx" => Some(Dialect::Tsx),
        "js" | "jsx" => Some(Dialect::Js),
        _ => None,
    }
}

/// One parser per dialect, created once per `index()` run.
pub(crate) struct Parsers {
    ts: Parser,
    tsx: Parser,
    js: Parser,
}

impl Parsers {
    pub(crate) fn new() -> Result<Self, IndexError> {
        let mut ts = Parser::new();
        ts.set_language(&tree_sitter_typescript::LANGUAGE_TYPESCRIPT.into())
            .map_err(|_| IndexError::Grammar("typescript"))?;
        let mut tsx = Parser::new();
        tsx.set_language(&tree_sitter_typescript::LANGUAGE_TSX.into())
            .map_err(|_| IndexError::Grammar("tsx"))?;
        let mut js = Parser::new();
        js.set_language(&tree_sitter_javascript::LANGUAGE.into())
            .map_err(|_| IndexError::Grammar("javascript"))?;
        Ok(Self { ts, tsx, js })
    }

    /// tree-sitter always yields a tree (error nodes included); `None`
    /// only on internal cancellation, which callers treat as an empty
    /// extraction — never a run failure.
    pub(crate) fn parse(&mut self, dialect: Dialect, source: &str) -> Option<Tree> {
        let parser = match dialect {
            Dialect::Ts => &mut self.ts,
            Dialect::Tsx => &mut self.tsx,
            Dialect::Js => &mut self.js,
        };
        parser.parse(source, None)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn dialect_selection_per_extension() {
        assert_eq!(dialect_for("a/b.ts"), Some(Dialect::Ts));
        assert_eq!(dialect_for("a/b.mts"), Some(Dialect::Ts));
        assert_eq!(dialect_for("a/b.cts"), Some(Dialect::Ts));
        assert_eq!(dialect_for("a/b.d.ts"), Some(Dialect::Ts));
        assert_eq!(dialect_for("a/b.tsx"), Some(Dialect::Tsx));
        assert_eq!(dialect_for("a/b.js"), Some(Dialect::Js));
        assert_eq!(dialect_for("a/b.jsx"), Some(Dialect::Js));
        assert_eq!(dialect_for("a/b.rs"), None);
    }

    #[test]
    fn grammars_load_and_parse_including_error_recovery() {
        let mut parsers = Parsers::new().expect("grammars load");
        let tree = parsers
            .parse(Dialect::Ts, "export const a: number = 1;")
            .expect("parse");
        assert_eq!(tree.root_node().kind(), "program");
        assert!(!tree.root_node().has_error());
        // A syntax error still yields a tree (error nodes included).
        let broken = parsers
            .parse(Dialect::Ts, "export const = ;;; function {")
            .expect("parse broken");
        assert!(broken.root_node().has_error());
    }
}
