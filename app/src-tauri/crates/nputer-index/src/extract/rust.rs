//! Rust extractor (T-010) — the sibling of [`super::ts`], built on the
//! same contract: one parsed file in, one [`ExtractRecord`] out.
//!
//! Hand-rolled cursor traversal, no .scm queries, same as the TS side.
//! Module-level extraction is a walk over `source_file`'s direct children
//! plus a recursion that enters INLINE `mod x { … }` bodies for their
//! `mod` and `use` declarations only.
//!
//! Explicitly NOT extracted (silence is by design, the TS extractor's own
//! rule applied to Rust's shapes): items inside an inline `mod` body or an
//! `impl`/`trait` block — an inline module is one `mod` symbol the way a
//! TS namespace is one `const` symbol, and an `impl` block is one `impl`
//! symbol the way a class is one `class` symbol; items inside functions;
//! `use` statements inside function bodies; macro-generated items;
//! `extern "C" { … }` (`foreign_mod_item`) innards; and call/type_ref
//! CANDIDATES — Rust emits no `call`/`type_ref` edges at all in T-010
//! (see the module docs on [`crate::resolve::rust`] for why).
//!
//! THE ANCHOR NORMALIZATION, because it is the one place the recorded
//! specifier is not byte-for-byte what the file says: a `use` inside an
//! inline module is rewritten so it anchors at the FILE's module instead
//! of the inline one — `use super::X` inside `mod tests { … }` is recorded
//! as `self::X`, and `use helper::X` inside it as `self::tests::helper::X`.
//! Without that the resolver would need the inline depth as a second
//! field, and a `self::`/`super::` path would mean different things
//! depending on where in the file it was written.

use std::collections::{btree_map::Entry, BTreeMap};

use tree_sitter::{Node, Tree};

use super::{ExtractRecord, Extractor, RawImport, RawMod, RawSymbol};

pub(crate) struct RustExtractor;

impl Extractor for RustExtractor {
    fn extract(&self, source: &str, tree: &Tree) -> ExtractRecord {
        let mut cx = Cx {
            src: source.as_bytes(),
            symbols: BTreeMap::new(),
            imports: Vec::new(),
            mods: Vec::new(),
        };
        cx.declarations(tree.root_node(), &[], true);
        ExtractRecord {
            symbols: cx.symbols.into_values().collect(),
            imports: cx.imports,
            calls: Vec::new(),
            type_refs: Vec::new(),
            mods: cx.mods,
        }
    }
}

struct Cx<'a> {
    src: &'a [u8],
    symbols: BTreeMap<String, RawSymbol>,
    imports: Vec<RawImport>,
    mods: Vec<RawMod>,
}

impl<'a> Cx<'a> {
    fn text(&self, node: Node) -> String {
        node.utf8_text(self.src).unwrap_or_default().to_string()
    }

    /// Node text with every whitespace run collapsed to one space —
    /// deterministic in the bytes, and what makes a multi-line
    /// `impl … for …` header a single legible symbol name.
    fn flat_text(&self, node: Node) -> String {
        let raw = self.text(node);
        let mut out = String::with_capacity(raw.len());
        let mut space = false;
        for ch in raw.chars() {
            if ch.is_whitespace() {
                space = !out.is_empty();
            } else {
                if space {
                    out.push(' ');
                }
                space = false;
                out.push(ch);
            }
        }
        out
    }

    /// `"…"` / `r"…"` / `r#"…"#` literal content. Escape sequences stay
    /// as written, exactly like the TS side's `string_text`.
    fn string_text(&self, node: Node) -> String {
        let raw = self.text(node);
        let inner = raw.trim_start_matches('r');
        let hashes = inner.len() - inner.trim_start_matches('#').len();
        let inner = &inner[hashes..];
        let inner = inner.strip_prefix('"').unwrap_or(inner);
        let inner = inner
            .strip_suffix(&"#".repeat(hashes))
            .unwrap_or(inner)
            .strip_suffix('"')
            .unwrap_or(inner);
        inner.to_string()
    }

    // ---- the declaration walk ---------------------------------------------

    /// Walk one declaration list. `inside` is the INLINE module path this
    /// list sits under within the file; `top` marks the file's own level,
    /// which is the only level that contributes SYMBOLS.
    fn declarations(&mut self, list: Node, inside: &[String], top: bool) {
        let mut cursor = list.walk();
        let children: Vec<Node> = list.named_children(&mut cursor).collect();
        drop(cursor);
        // Attributes are SIBLING statements in this grammar, not children
        // of the item they decorate, so `#[path = "x.rs"]` has to be
        // carried forward to the next real item.
        let mut path_attr: Option<String> = None;
        for child in children {
            match child.kind() {
                "attribute_item" => {
                    if let Some(value) = self.path_attribute(child) {
                        path_attr = Some(value);
                    }
                    continue;
                }
                "line_comment" | "block_comment" | "inner_attribute_item" => continue,
                _ => {}
            }
            let attr = path_attr.take();
            match child.kind() {
                "mod_item" => self.mod_item(child, inside, top, attr),
                "use_declaration" => self.use_declaration(child, inside),
                "extern_crate_declaration" => self.extern_crate(child),
                "function_item" | "function_signature_item" => {
                    self.named_item(child, "fn", top);
                }
                "struct_item" | "union_item" => self.named_item(child, "struct", top),
                "enum_item" => self.named_item(child, "enum", top),
                "trait_item" => self.named_item(child, "trait", top),
                "type_item" | "associated_type" => self.named_item(child, "type", top),
                "const_item" | "static_item" => self.named_item(child, "const", top),
                "macro_definition" => self.named_item(child, "macro", top),
                "impl_item" => {
                    if top {
                        let name = self.impl_name(child);
                        // An `impl` is never `pub` — its members carry
                        // their own visibility and are not extracted, so
                        // the block itself is recorded unexported.
                        self.push_symbol(name, "impl", false, child);
                    }
                }
                _ => {}
            }
        }
    }

    /// The string value of a `#[path = "…"]` attribute, or None for every
    /// other attribute.
    fn path_attribute(&self, item: Node) -> Option<String> {
        let mut c = item.walk();
        let attr = item.named_children(&mut c).find(|n| n.kind() == "attribute")?;
        // The attribute's own name is its first NAMED child and carries no
        // field in this grammar: `(attribute (identifier) value: (…))`.
        let name = attr.named_child(0)?;
        if self.text(name) != "path" {
            return None;
        }
        let value = attr.child_by_field_name("value")?;
        (value.kind() == "string_literal" || value.kind() == "raw_string_literal")
            .then(|| self.string_text(value))
    }

    fn mod_item(&mut self, node: Node, inside: &[String], top: bool, path_attr: Option<String>) {
        let Some(name_node) = node.child_by_field_name("name") else {
            return;
        };
        let name = self.text(name_node);
        if name.is_empty() {
            return;
        }
        let body = node.child_by_field_name("body");
        self.mods.push(RawMod {
            inside: inside.to_vec(),
            name: name.clone(),
            file: path_attr,
            inline: body.is_some(),
        });
        if top {
            self.push_symbol(name.clone(), "mod", self.is_exported(node), node);
        }
        if let Some(body) = body {
            let mut nested: Vec<String> = inside.to_vec();
            nested.push(name);
            // Inline bodies contribute their `mod`/`use` declarations and
            // NOT their items — one inline module is one symbol.
            self.declarations(body, &nested, false);
        }
    }

    fn named_item(&mut self, node: Node, kind: &str, top: bool) {
        if !top {
            return;
        }
        let Some(name) = node.child_by_field_name("name") else {
            return;
        };
        let name = self.text(name);
        self.push_symbol(name, kind, self.is_exported(node), node);
    }

    /// `impl Type` / `impl Trait for Type`, whitespace-collapsed. The name
    /// carries the `impl ` prefix on purpose: without it an inherent impl
    /// would merge into the `struct` symbol of the same name and the kind
    /// `impl` could never be observed.
    fn impl_name(&self, node: Node) -> String {
        let ty = node
            .child_by_field_name("type")
            .map(|n| self.flat_text(n))
            .unwrap_or_default();
        match node.child_by_field_name("trait") {
            Some(tr) => format!("impl {} for {}", self.flat_text(tr), ty),
            None => format!("impl {ty}"),
        }
    }

    /// EXPORTED means "visible outside its own module" — the direct
    /// analogue of TS's `export`, so every `pub` form counts. `pub(self)`
    /// is the one spelling that is private in effect and is excluded.
    fn is_exported(&self, node: Node) -> bool {
        let mut c = node.walk();
        let visible = node.children(&mut c).any(|n| {
            n.kind() == "visibility_modifier" && {
                let text = self.flat_text(n);
                text != "pub(self)" && text != "pub (self)"
            }
        });
        visible
    }

    fn push_symbol(&mut self, name: String, kind: &str, exported: bool, node: Node) {
        if name.is_empty() {
            return;
        }
        let start = node.start_position().row + 1;
        let end = node.end_position().row + 1;
        match self.symbols.entry(name) {
            Entry::Vacant(v) => {
                let name = v.key().clone();
                v.insert(RawSymbol {
                    name,
                    kind: kind.to_string(),
                    exported,
                    range: [start, end],
                });
            }
            Entry::Occupied(mut o) => {
                // Same merge rule as the TS side (two `impl Foo` blocks, a
                // `mod x;` beside a `fn x`, a cfg-gated pair): exported =
                // any, range = [min, max], kind = earliest declaration's
                // (tie: kind name asc).
                let sym = o.get_mut();
                sym.exported |= exported;
                if start < sym.range[0] || (start == sym.range[0] && kind < sym.kind.as_str()) {
                    sym.kind = kind.to_string();
                }
                sym.range = [sym.range[0].min(start), sym.range[1].max(end)];
            }
        }
    }

    // ---- use declarations --------------------------------------------------

    fn use_declaration(&mut self, node: Node, inside: &[String]) {
        let Some(argument) = node.child_by_field_name("argument") else {
            return;
        };
        let reexport = self.is_exported(node);
        let mut paths: Vec<UsePath> = Vec::new();
        self.use_tree(argument, &[], &mut paths);
        for path in paths {
            let Some(specifier) = self.anchor(&path, inside) else {
                continue;
            };
            self.imports.push(RawImport {
                specifier,
                // Rust edges name their imported symbol from the
                // module/item split the resolver performs, so the
                // pre-resolution record carries no bindings.
                names: Vec::new(),
                reexport,
            });
        }
    }

    /// Flatten one use tree into absolute-ish segment lists. `prefix` is
    /// the path accumulated by the enclosing `{ … }` groups.
    fn use_tree(&self, node: Node, prefix: &[String], out: &mut Vec<UsePath>) {
        match node.kind() {
            "use_list" => {
                let mut c = node.walk();
                let children: Vec<Node> = node.named_children(&mut c).collect();
                for child in children {
                    self.use_tree(child, prefix, out);
                }
            }
            "scoped_use_list" => {
                let mut base = prefix.to_vec();
                if let Some(path) = node.child_by_field_name("path") {
                    base.extend(self.path_segments(path));
                }
                if let Some(list) = node.child_by_field_name("list") {
                    self.use_tree(list, &base, out);
                }
            }
            "use_as_clause" => {
                if let Some(path) = node.child_by_field_name("path") {
                    self.use_tree(path, prefix, out);
                }
            }
            "use_wildcard" => {
                let mut base = prefix.to_vec();
                let mut c = node.walk();
                let children: Vec<Node> = node.named_children(&mut c).collect();
                for child in children {
                    base.extend(self.path_segments(child));
                }
                out.push(UsePath {
                    segments: base,
                    glob: true,
                });
            }
            // A BARE `self` inside a group — `use a::{self, B}` — names the
            // prefix module itself, not a segment called "self".
            "self" if !prefix.is_empty() => out.push(UsePath {
                segments: prefix.to_vec(),
                glob: false,
            }),
            "identifier" | "scoped_identifier" | "crate" | "self" | "super" | "metavariable"
            | "type_identifier" | "primitive_type" => {
                let mut base = prefix.to_vec();
                base.extend(self.path_segments(node));
                out.push(UsePath {
                    segments: base,
                    glob: false,
                });
            }
            _ => {}
        }
    }

    /// Segments of a path node, outermost first. A leading `::` shows up
    /// as an empty first segment and is dropped.
    fn path_segments(&self, node: Node) -> Vec<String> {
        let mut out = Vec::new();
        self.collect_segments(node, &mut out);
        out.retain(|s| !s.is_empty());
        out
    }

    fn collect_segments(&self, node: Node, out: &mut Vec<String>) {
        match node.kind() {
            "scoped_identifier" | "scoped_type_identifier" => {
                if let Some(path) = node.child_by_field_name("path") {
                    self.collect_segments(path, out);
                }
                if let Some(name) = node.child_by_field_name("name") {
                    self.collect_segments(name, out);
                }
            }
            "generic_type" => {
                // `use a::b::C<D>` is not legal, but a path node reached
                // through an alias clause can still carry one; keep the
                // base only.
                if let Some(ty) = node.child_by_field_name("type") {
                    self.collect_segments(ty, out);
                }
            }
            "bracketed_type" | "generic_type_with_turbofish" => {}
            _ => out.push(self.text(node)),
        }
    }

    /// Rewrite an inline-module-relative path so it anchors at the FILE's
    /// module. See this module's header for why. `None` drops a path that
    /// cannot be anchored at all (an empty tree).
    fn anchor(&self, path: &UsePath, inside: &[String]) -> Option<String> {
        let mut segments: Vec<String> = path.segments.clone();
        if segments.is_empty() {
            // `use foo::{self}` at the file's own level: the module IS the
            // target and `foo` was consumed into the prefix, so an empty
            // list here can only come from a malformed tree.
            return None;
        }
        if !inside.is_empty() {
            let mut depth = inside.len();
            let mut rest: &[String] = &segments;
            let mut supers = 0usize;
            while rest.first().map(String::as_str) == Some("super") {
                supers += 1;
                rest = &rest[1..];
            }
            if supers > 0 {
                // Each `super` climbs one inline level; leftovers stay as
                // `super` and climb out of the file.
                let climbed = supers.min(depth);
                depth -= climbed;
                let mut out: Vec<String> = std::iter::repeat("super".to_string())
                    .take(supers - climbed)
                    .collect();
                if supers - climbed == 0 {
                    out.push("self".to_string());
                    out.extend(inside[..depth].iter().cloned());
                }
                out.extend(rest.iter().cloned());
                segments = out;
            } else {
                let anchored = matches!(
                    segments[0].as_str(),
                    "crate" | "self" | "super" | "$crate"
                );
                if anchored {
                    if segments[0] == "self" {
                        let mut out = vec!["self".to_string()];
                        out.extend(inside.iter().cloned());
                        out.extend(segments[1..].iter().cloned());
                        segments = out;
                    }
                } else {
                    // A uniform path inside an inline module resolves
                    // against THAT module's items, never the file's.
                    let mut out = vec!["self".to_string()];
                    out.extend(inside.iter().cloned());
                    out.extend(segments.iter().cloned());
                    segments = out;
                }
            }
        }
        let mut spec = segments.join("::");
        if path.glob {
            if spec.is_empty() {
                return None;
            }
            spec.push_str("::*");
        }
        (!spec.is_empty()).then_some(spec)
    }

    fn extern_crate(&mut self, node: Node) {
        let Some(name) = node.child_by_field_name("name") else {
            return;
        };
        let name = self.text(name);
        if name.is_empty() || name == "self" {
            return;
        }
        self.imports.push(RawImport {
            specifier: name,
            names: Vec::new(),
            reexport: self.is_exported(node),
        });
    }
}

struct UsePath {
    segments: Vec<String>,
    glob: bool,
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::extract::Extractor;
    use crate::parse::{Dialect, Parsers};

    fn extract(source: &str) -> ExtractRecord {
        let mut parsers = Parsers::new().expect("grammars load");
        let tree = parsers.parse(Dialect::Rust, source).expect("parse");
        RustExtractor.extract(source, &tree)
    }

    fn symbol<'r>(record: &'r ExtractRecord, name: &str) -> &'r RawSymbol {
        record
            .symbols
            .iter()
            .find(|s| s.name == name)
            .unwrap_or_else(|| panic!("no symbol {name} in {:?}", record.symbols))
    }

    fn specifiers(record: &ExtractRecord) -> Vec<&str> {
        record.imports.iter().map(|i| i.specifier.as_str()).collect()
    }

    #[test]
    fn every_criterion_kind_is_emitted_with_its_export_flag_and_range() {
        let record = extract(
            "pub fn f() {}\n\
             struct S;\n\
             pub enum E { A }\n\
             pub(crate) trait T {}\n\
             impl T for S {}\n\
             pub mod m {}\n\
             #[macro_export]\n\
             macro_rules! mac { () => {}; }\n",
        );
        let kinds: Vec<(&str, &str, bool)> = record
            .symbols
            .iter()
            .map(|s| (s.name.as_str(), s.kind.as_str(), s.exported))
            .collect();
        assert_eq!(
            kinds,
            vec![
                ("E", "enum", true),
                ("S", "struct", false),
                ("T", "trait", true),
                ("f", "fn", true),
                ("impl T for S", "impl", false),
                ("m", "mod", true),
                ("mac", "macro", false),
            ]
        );
        // 1-based inclusive rows of the declaration node.
        assert_eq!(symbol(&record, "f").range, [1, 1]);
        assert_eq!(symbol(&record, "E").range, [3, 3]);
    }

    #[test]
    fn const_static_type_and_union_fold_into_the_closed_kind_vocabulary() {
        let record = extract(
            "pub const C: u8 = 1;\n\
             static S: u8 = 2;\n\
             pub type Alias = u8;\n\
             pub union U { a: u8 }\n",
        );
        assert_eq!(symbol(&record, "C").kind, "const");
        assert_eq!(symbol(&record, "S").kind, "const");
        assert_eq!(symbol(&record, "Alias").kind, "type");
        assert_eq!(symbol(&record, "U").kind, "struct");
    }

    #[test]
    fn pub_self_is_not_an_export_but_every_other_pub_form_is() {
        let record = extract(
            "pub(self) fn hidden() {}\n\
             pub(super) fn up() {}\n\
             pub(in crate::a) fn scoped() {}\n\
             fn plain() {}\n",
        );
        assert!(!symbol(&record, "hidden").exported);
        assert!(symbol(&record, "up").exported);
        assert!(symbol(&record, "scoped").exported);
        assert!(!symbol(&record, "plain").exported);
    }

    #[test]
    fn inline_module_and_impl_bodies_contribute_no_symbols_of_their_own() {
        let record = extract(
            "struct S;\n\
             impl S {\n\
                 pub fn method(&self) {}\n\
                 const INNER: u8 = 1;\n\
             }\n\
             mod inner {\n\
                 pub fn buried() {}\n\
                 pub struct Buried;\n\
             }\n",
        );
        let names: Vec<&str> = record.symbols.iter().map(|s| s.name.as_str()).collect();
        assert_eq!(names, vec!["S", "impl S", "inner"]);
    }

    #[test]
    fn use_trees_flatten_groups_globs_aliases_and_self() {
        let record = extract(
            "use std::fs;\n\
             use std::path::{Path, PathBuf};\n\
             use crate::agent::runner::{self, RunEvent};\n\
             use serde::Serialize as Ser;\n\
             use super::helpers::*;\n\
             use ::core::mem;\n",
        );
        assert_eq!(
            specifiers(&record),
            vec![
                "std::fs",
                "std::path::Path",
                "std::path::PathBuf",
                "crate::agent::runner",
                "crate::agent::runner::RunEvent",
                "serde::Serialize",
                "super::helpers::*",
                "core::mem",
            ]
        );
        assert!(record.imports.iter().all(|i| !i.reexport));
    }

    #[test]
    fn pub_use_is_a_reexport_and_a_plain_use_is_not() {
        let record = extract("pub use crate::a::B;\nuse crate::c::D;\n");
        let marks: Vec<(&str, bool)> = record
            .imports
            .iter()
            .map(|i| (i.specifier.as_str(), i.reexport))
            .collect();
        assert_eq!(marks, vec![("crate::a::B", true), ("crate::c::D", false)]);
    }

    #[test]
    fn mod_declarations_record_inline_nesting_and_the_path_attribute() {
        let record = extract(
            "mod plain;\n\
             #[path = \"weird/place.rs\"]\n\
             mod relocated;\n\
             #[cfg(test)]\n\
             mod tests {\n\
                 mod deep;\n\
             }\n",
        );
        assert_eq!(
            record.mods,
            vec![
                RawMod {
                    inside: vec![],
                    name: "plain".into(),
                    file: None,
                    inline: false
                },
                RawMod {
                    inside: vec![],
                    name: "relocated".into(),
                    file: Some("weird/place.rs".into()),
                    inline: false
                },
                RawMod {
                    inside: vec![],
                    name: "tests".into(),
                    file: None,
                    inline: true
                },
                RawMod {
                    inside: vec!["tests".into()],
                    name: "deep".into(),
                    file: None,
                    inline: false
                },
            ]
        );
        // The `#[cfg(test)]` attribute must not be mistaken for a `#[path]`
        // and leak onto the `tests` module.
        assert_eq!(record.mods[2].file, None);
    }

    #[test]
    fn uses_inside_an_inline_module_are_anchored_at_the_file() {
        let record = extract(
            "mod tests {\n\
                 use super::*;\n\
                 use super::super::sibling::X;\n\
                 use crate::a::B;\n\
                 use helpers::H;\n\
                 use self::inner::I;\n\
             }\n",
        );
        assert_eq!(
            specifiers(&record),
            vec![
                "self::*",
                "super::sibling::X",
                "crate::a::B",
                "self::tests::helpers::H",
                "self::tests::inner::I",
            ]
        );
    }

    #[test]
    fn extern_crate_is_an_import_occurrence() {
        let record = extract("extern crate serde;\npub extern crate legacy as l;\n");
        let marks: Vec<(&str, bool)> = record
            .imports
            .iter()
            .map(|i| (i.specifier.as_str(), i.reexport))
            .collect();
        assert_eq!(marks, vec![("serde", false), ("legacy", true)]);
    }

    #[test]
    fn a_syntax_error_still_extracts_what_parses_and_never_panics() {
        let record = extract("pub fn fine() {}\nfn (((broken \n struct S;\n");
        assert!(record.symbols.iter().any(|s| s.name == "fine"));
    }

    #[test]
    fn merged_declarations_take_the_union_range_and_the_earliest_kind() {
        let record = extract(
            "struct Foo;\n\
             impl Foo {\n\
                 fn a(&self) {}\n\
             }\n\
             pub impl_marker!();\n\
             impl Foo {\n\
                 fn b(&self) {}\n\
             }\n",
        );
        let merged = symbol(&record, "impl Foo");
        assert_eq!(merged.kind, "impl");
        assert_eq!(merged.range, [2, 8]);
    }
}

