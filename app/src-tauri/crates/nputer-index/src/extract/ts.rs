//! TS/TSX/JS/JSX extractor — one extractor serves all four dialects; the
//! JS grammar's shapes are a subset of the TS grammar's for everything
//! extracted here (plan §5).
//!
//! Hand-rolled cursor traversal, no .scm queries: module-level extraction
//! is a walk over `program`'s direct children plus one recursive candidate
//! scan.
//!
//! Explicitly NOT extracted (silence is by design, plan §5): class or
//! interface members and methods, nested/inner functions, local
//! variables, decorators (the scan does not descend into them),
//! JSX component-usage edges, re-exported names as symbol entries,
//! non-literal `require`/`import()` arguments, triple-slash directives,
//! `declare global` innards, string-named ambient modules
//! (`declare module "x"`), and `import x = require("y")` (TS
//! import-equals form).

use std::collections::{btree_map::Entry, BTreeMap, BTreeSet};

use tree_sitter::{Node, Tree};

use super::{Candidate, ExtractRecord, Extractor, NameBinding, RawImport, RawSymbol};

pub(crate) struct TsExtractor;

impl Extractor for TsExtractor {
    fn extract(&self, source: &str, tree: &Tree) -> ExtractRecord {
        let mut cx = Cx {
            src: source.as_bytes(),
            symbols: BTreeMap::new(),
            spans: Vec::new(),
            imports: Vec::new(),
            export_marks: BTreeSet::new(),
            calls: BTreeSet::new(),
            type_refs: BTreeSet::new(),
        };

        let root = tree.root_node();
        let mut cursor = root.walk();
        for child in root.named_children(&mut cursor) {
            cx.module_statement(child, false);
        }
        drop(cursor);

        // `export { a, b as c }` lists and `export default <identifier>`
        // may reference declarations before OR after themselves: applied
        // as a second pass.
        for name in std::mem::take(&mut cx.export_marks) {
            if let Some(sym) = cx.symbols.get_mut(&name) {
                sym.exported = true;
            }
        }

        cx.spans.sort_by_key(|s| s.0);
        cx.scan(root);

        ExtractRecord {
            symbols: cx.symbols.into_values().collect(),
            imports: cx.imports,
            calls: cx.calls.into_iter().collect(),
            type_refs: cx.type_refs.into_iter().collect(),
            mods: Vec::new(), // Rust only (T-010)
        }
    }
}

struct Cx<'a> {
    src: &'a [u8],
    symbols: BTreeMap<String, RawSymbol>,
    /// (start_byte, end_byte, symbol name) per module-level declaration —
    /// the enclosing-symbol lookup for candidates. Disjoint by
    /// construction (module-level statement spans; merged declarations
    /// contribute one span each).
    spans: Vec<(usize, usize, String)>,
    imports: Vec<RawImport>,
    export_marks: BTreeSet<String>,
    calls: BTreeSet<Candidate>,
    type_refs: BTreeSet<Candidate>,
}

impl<'a> Cx<'a> {
    fn text(&self, node: Node) -> String {
        node.utf8_text(self.src).unwrap_or_default().to_string()
    }

    /// String-literal text with the surrounding quote characters removed;
    /// escape sequences stay as written (honest `unresolved.specifier`).
    fn string_text(&self, node: Node) -> String {
        let raw = self.text(node);
        if raw.len() >= 2 {
            raw[1..raw.len() - 1].to_string()
        } else {
            raw
        }
    }

    // ---- module-level walk ------------------------------------------------

    fn module_statement(&mut self, node: Node, exported: bool) {
        match node.kind() {
            "import_statement" => self.import_statement(node),
            "export_statement" => self.export_statement(node),
            "ambient_declaration" => {
                // `declare X` unwraps to X; `declare global { … }` innards
                // are skipped (statement_block child).
                let mut c = node.walk();
                let children: Vec<Node> = node.named_children(&mut c).collect();
                for ch in children {
                    if ch.kind() == "statement_block" {
                        continue;
                    }
                    self.module_statement(ch, exported);
                }
            }
            "expression_statement" => {
                // `namespace X {}` parses as expression_statement(internal_module).
                let mut c = node.walk();
                let children: Vec<Node> = node.named_children(&mut c).collect();
                for ch in children {
                    if ch.kind() == "internal_module" || ch.kind() == "module" {
                        self.module_statement(ch, exported);
                    }
                }
            }
            "function_declaration" | "generator_function_declaration" | "function_signature" => {
                self.named_declaration(node, "function", exported);
            }
            "class_declaration" | "abstract_class_declaration" => {
                self.named_declaration(node, "class", exported);
            }
            "interface_declaration" => self.named_declaration(node, "interface", exported),
            "type_alias_declaration" => self.named_declaration(node, "type", exported),
            "enum_declaration" => self.named_declaration(node, "enum", exported),
            "internal_module" | "module" => {
                // Identifier-named namespaces only; `declare module "x"`
                // (string-named) is not extracted. Kind folds into `const`
                // (a namespace is a value-side container; the §3.1 kind
                // vocabulary is closed — same rationale as let/var).
                if let Some(name) = node.child_by_field_name("name") {
                    if name.kind() == "identifier" {
                        let name = self.text(name);
                        self.push_symbol(name, "const", exported, node);
                    }
                }
            }
            "lexical_declaration" | "variable_declaration" => {
                let mut c = node.walk();
                let decls: Vec<Node> = node.named_children(&mut c).collect();
                for decl in decls {
                    if decl.kind() != "variable_declarator" {
                        continue;
                    }
                    if let Some(pattern) = decl.child_by_field_name("name") {
                        let mut names = Vec::new();
                        self.pattern_names(pattern, &mut names);
                        for name in names {
                            // All module-scope bindings — const, let, var,
                            // destructured — carry kind `const` (closed
                            // vocabulary; the map doesn't care about
                            // mutability). Range = the declarator's rows.
                            self.push_symbol(name, "const", exported, decl);
                        }
                    }
                }
            }
            _ => {}
        }
    }

    fn named_declaration(&mut self, node: Node, kind: &str, exported: bool) {
        if let Some(name) = node.child_by_field_name("name") {
            let name = self.text(name);
            self.push_symbol(name, kind, exported, node);
        }
        // Anonymous default exports (`export default function () {}`)
        // have no name to id — skipped.
    }

    /// Binding identifiers of a declarator pattern: plain identifiers,
    /// object/array destructuring (incl. defaults and rest), recursively.
    fn pattern_names(&self, node: Node, out: &mut Vec<String>) {
        match node.kind() {
            "identifier" | "shorthand_property_identifier_pattern" => {
                out.push(self.text(node));
            }
            "object_pattern" | "array_pattern" => {
                let mut c = node.walk();
                for ch in node.named_children(&mut c) {
                    self.pattern_names(ch, out);
                }
            }
            "pair_pattern" => {
                if let Some(value) = node.child_by_field_name("value") {
                    self.pattern_names(value, out);
                }
            }
            "rest_pattern" => {
                let mut c = node.walk();
                for ch in node.named_children(&mut c) {
                    self.pattern_names(ch, out);
                }
            }
            "object_assignment_pattern" | "assignment_pattern" => {
                if let Some(left) = node.child_by_field_name("left") {
                    self.pattern_names(left, out);
                }
            }
            _ => {}
        }
    }

    fn push_symbol(&mut self, name: String, kind: &str, exported: bool, node: Node) {
        if name.is_empty() {
            return;
        }
        let start = node.start_position().row + 1;
        let end = node.end_position().row + 1;
        self.spans
            .push((node.start_byte(), node.end_byte(), name.clone()));
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
                // Declaration merging: exported = any, range = [min, max],
                // kind = earliest declaration's (tie: kind name asc).
                let sym = o.get_mut();
                sym.exported |= exported;
                if start < sym.range[0] || (start == sym.range[0] && kind < sym.kind.as_str()) {
                    sym.kind = kind.to_string();
                }
                sym.range = [sym.range[0].min(start), sym.range[1].max(end)];
            }
        }
    }

    // ---- imports ----------------------------------------------------------

    fn import_statement(&mut self, node: Node) {
        let mut c = node.walk();
        let children: Vec<Node> = node.named_children(&mut c).collect();
        // `import x = require("y")` (import_require_clause): not extracted.
        if children.iter().any(|n| n.kind() == "import_require_clause") {
            return;
        }
        let Some(source) = node.child_by_field_name("source") else {
            return;
        };
        let mut names: Vec<NameBinding> = Vec::new();
        for ch in &children {
            if ch.kind() != "import_clause" {
                continue;
            }
            let mut c2 = ch.walk();
            let clause_children: Vec<Node> = ch.named_children(&mut c2).collect();
            for part in clause_children {
                match part.kind() {
                    "identifier" => names.push(NameBinding {
                        source: "default".to_string(),
                        local: Some(self.text(part)),
                    }),
                    "namespace_import" => {
                        let mut c3 = part.walk();
                        let local = part
                            .named_children(&mut c3)
                            .find(|n| n.kind() == "identifier")
                            .map(|n| self.text(n));
                        names.push(NameBinding {
                            source: "*".to_string(),
                            local,
                        });
                    }
                    "named_imports" => {
                        let mut c3 = part.walk();
                        let specs: Vec<Node> = part.named_children(&mut c3).collect();
                        for spec in specs {
                            if spec.kind() != "import_specifier" {
                                continue;
                            }
                            let Some(name) = spec.child_by_field_name("name") else {
                                continue;
                            };
                            let source_name = self.text(name);
                            let local = spec
                                .child_by_field_name("alias")
                                .map(|a| self.text(a))
                                .or_else(|| Some(source_name.clone()));
                            names.push(NameBinding {
                                source: source_name,
                                local,
                            });
                        }
                    }
                    _ => {}
                }
            }
        }
        let specifier = self.string_text(source);
        self.imports.push(RawImport {
            specifier,
            names,
            reexport: false,
        });
    }

    fn export_statement(&mut self, node: Node) {
        if let Some(source) = node.child_by_field_name("source") {
            // Re-export: `export { a } from`, `export * from`,
            // `export * as ns from` — recorded as import edges with
            // reexport: true. Re-exports bind nothing locally.
            let mut names: Vec<NameBinding> = Vec::new();
            let mut saw_clause = false;
            let mut c = node.walk();
            for ch in node.named_children(&mut c) {
                match ch.kind() {
                    "export_clause" => {
                        saw_clause = true;
                        let mut c2 = ch.walk();
                        for spec in ch.named_children(&mut c2) {
                            if spec.kind() != "export_specifier" {
                                continue;
                            }
                            if let Some(name) = spec.child_by_field_name("name") {
                                names.push(NameBinding {
                                    source: self.text(name),
                                    local: None,
                                });
                            }
                        }
                    }
                    "namespace_export" => {
                        // `export * as ns from "x"`: the whole namespace
                        // is taken — source-side coverage is "*".
                        saw_clause = true;
                        names.push(NameBinding {
                            source: "*".to_string(),
                            local: None,
                        });
                    }
                    _ => {}
                }
            }
            if !saw_clause {
                // Bare `export * from "x"`.
                names.push(NameBinding {
                    source: "*".to_string(),
                    local: None,
                });
            }
            let specifier = self.string_text(source);
            self.imports.push(RawImport {
                specifier,
                names,
                reexport: true,
            });
            return;
        }
        if let Some(declaration) = node.child_by_field_name("declaration") {
            self.module_statement(declaration, true);
            return;
        }
        if let Some(value) = node.child_by_field_name("value") {
            // `export default <expr>`: an identifier marks that binding
            // exported; anonymous expressions have no name to id.
            if value.kind() == "identifier" {
                let name = self.text(value);
                self.export_marks.insert(name);
            }
            return;
        }
        // `export { a, b as c }` (no source): marks LOCAL names exported.
        let mut c = node.walk();
        let clauses: Vec<Node> = node.named_children(&mut c).collect();
        for ch in clauses {
            if ch.kind() != "export_clause" {
                continue;
            }
            let mut c2 = ch.walk();
            let specs: Vec<Node> = ch.named_children(&mut c2).collect();
            for spec in specs {
                if spec.kind() != "export_specifier" {
                    continue;
                }
                if let Some(name) = spec.child_by_field_name("name") {
                    let name = self.text(name);
                    self.export_marks.insert(name);
                }
            }
        }
    }

    // ---- recursive candidate scan ----------------------------------------

    fn scan(&mut self, node: Node) {
        match node.kind() {
            "decorator" => return, // decorators are not extracted at all
            "call_expression" => {
                if let Some(function) = node.child_by_field_name("function") {
                    match function.kind() {
                        "identifier" => {
                            let name = self.text(function);
                            if name == "require" {
                                if let Some(spec) = self.single_string_arg(node) {
                                    let names = self.require_bindings(node);
                                    self.imports.push(RawImport {
                                        specifier: spec,
                                        names,
                                        reexport: false,
                                    });
                                    // A string-literal require is an import
                                    // occurrence, not a call candidate; its
                                    // argument holds no candidates either.
                                    return;
                                }
                                // Non-literal require(x): not extracted as an
                                // import; falls through as an (unbindable)
                                // call candidate like any other name.
                            }
                            self.push_candidate(node, name, CandidateKind::Call);
                        }
                        "import" => {
                            if let Some(spec) = self.single_string_arg(node) {
                                let names = self.require_bindings(node);
                                self.imports.push(RawImport {
                                    specifier: spec,
                                    names,
                                    reexport: false,
                                });
                                return;
                            }
                            // Non-literal dynamic import: not extracted.
                        }
                        _ => {} // member calls (obj.m()) are not built
                    }
                }
            }
            "new_expression" => {
                if let Some(constructor) = node.child_by_field_name("constructor") {
                    if constructor.kind() == "identifier" {
                        let name = self.text(constructor);
                        self.push_candidate(node, name, CandidateKind::Call);
                    }
                }
            }
            "type_identifier" => {
                if self.is_type_ref_position(node) {
                    let name = self.text(node);
                    self.push_candidate(node, name, CandidateKind::TypeRef);
                }
            }
            _ => {}
        }
        let mut c = node.walk();
        let children: Vec<Node> = node.named_children(&mut c).collect();
        for child in children {
            self.scan(child);
        }
    }

    /// A `type_identifier` is a reference unless it IS a declared name:
    /// the `name` of a declaration or a type-parameter, or part of a
    /// qualified `ns.T` (nested_type_identifier — not built).
    fn is_type_ref_position(&self, node: Node) -> bool {
        let Some(parent) = node.parent() else {
            return false;
        };
        match parent.kind() {
            "nested_type_identifier" => false,
            "interface_declaration"
            | "type_alias_declaration"
            | "class_declaration"
            | "abstract_class_declaration"
            | "type_parameter"
            | "internal_module"
            | "module" => parent
                .child_by_field_name("name")
                .map(|n| n.id() != node.id())
                .unwrap_or(true),
            _ => true,
        }
    }

    fn push_candidate(&mut self, node: Node, name: String, kind: CandidateKind) {
        if name.is_empty() {
            return;
        }
        let Some(enclosing) = self.enclosing_symbol(node.start_byte()) else {
            return; // top-level statement outside any module-level symbol
        };
        let candidate = Candidate { enclosing, name };
        match kind {
            CandidateKind::Call => self.calls.insert(candidate),
            CandidateKind::TypeRef => self.type_refs.insert(candidate),
        };
    }

    /// The module-level symbol whose declaration span contains `pos`
    /// (spans are sorted and disjoint; binary search).
    fn enclosing_symbol(&self, pos: usize) -> Option<String> {
        let idx = self.spans.partition_point(|s| s.0 <= pos);
        if idx == 0 {
            return None;
        }
        let (start, end, name) = &self.spans[idx - 1];
        (*start <= pos && pos < *end).then(|| name.clone())
    }

    /// Exactly one string argument (comments ignored) -> its text.
    fn single_string_arg(&self, call: Node) -> Option<String> {
        let args = call.child_by_field_name("arguments")?;
        let mut c = args.walk();
        let real: Vec<Node> = args
            .named_children(&mut c)
            .filter(|n| n.kind() != "comment")
            .collect();
        match real.as_slice() {
            [only] if only.kind() == "string" => Some(self.string_text(*only)),
            _ => None,
        }
    }

    /// Binding names for `const x = require("m")` / `= await import("m")`:
    /// identifier -> "*", shallow object pattern -> named sources.
    /// Anything else (expression position, nesting, defaults): no names.
    fn require_bindings(&self, call: Node) -> Vec<NameBinding> {
        let mut n = call;
        loop {
            let Some(parent) = n.parent() else {
                return Vec::new();
            };
            match parent.kind() {
                "await_expression" | "parenthesized_expression" => n = parent,
                "variable_declarator" => {
                    if parent.child_by_field_name("value").map(|v| v.id()) != Some(n.id()) {
                        return Vec::new();
                    }
                    let Some(pattern) = parent.child_by_field_name("name") else {
                        return Vec::new();
                    };
                    return match pattern.kind() {
                        "identifier" => vec![NameBinding {
                            source: "*".to_string(),
                            local: Some(self.text(pattern)),
                        }],
                        "object_pattern" => {
                            let mut out = Vec::new();
                            let mut c = pattern.walk();
                            for ch in pattern.named_children(&mut c) {
                                match ch.kind() {
                                    "shorthand_property_identifier_pattern" => {
                                        let name = self.text(ch);
                                        out.push(NameBinding {
                                            source: name.clone(),
                                            local: Some(name),
                                        });
                                    }
                                    "pair_pattern" => {
                                        let key = ch.child_by_field_name("key");
                                        let value = ch.child_by_field_name("value");
                                        if let (Some(key), Some(value)) = (key, value) {
                                            if value.kind() == "identifier" {
                                                out.push(NameBinding {
                                                    source: self.text(key),
                                                    local: Some(self.text(value)),
                                                });
                                            }
                                        }
                                    }
                                    _ => {}
                                }
                            }
                            out
                        }
                        _ => Vec::new(),
                    };
                }
                _ => return Vec::new(),
            }
        }
    }
}

enum CandidateKind {
    Call,
    TypeRef,
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::parse::{Dialect, Parsers};

    fn extract_src(dialect: Dialect, src: &str) -> ExtractRecord {
        let mut parsers = Parsers::new().expect("grammars");
        let tree = parsers.parse(dialect, src).expect("parse");
        TsExtractor.extract(src, &tree)
    }

    fn ts(src: &str) -> ExtractRecord {
        extract_src(Dialect::Ts, src)
    }

    fn sym<'a>(rec: &'a ExtractRecord, name: &str) -> &'a RawSymbol {
        rec.symbols
            .iter()
            .find(|s| s.name == name)
            .unwrap_or_else(|| panic!("symbol {name} missing: {:?}", rec.symbols))
    }

    #[test]
    fn symbol_kinds_cover_the_ts_vocabulary() {
        let rec = ts(r#"export function fnDecl() {}
function* genDecl() {}
export class ClassDecl {}
export abstract class AbstractDecl {}
export interface IfaceDecl { x: number }
export type TypeDecl = number;
export enum EnumDecl { A, B }
export const constDecl = 1;
let letDecl = 2;
var varDecl = 3;
namespace NsDecl { export const inner = 1; }
"#);
        for (name, kind) in [
            ("fnDecl", "function"),
            ("genDecl", "function"),
            ("ClassDecl", "class"),
            ("AbstractDecl", "class"),
            ("IfaceDecl", "interface"),
            ("TypeDecl", "type"),
            ("EnumDecl", "enum"),
            ("constDecl", "const"),
            ("letDecl", "const"),
            ("varDecl", "const"),
            ("NsDecl", "const"),
        ] {
            assert_eq!(sym(&rec, name).kind, kind, "{name}");
        }
        // Namespace innards are not module-scope symbols.
        assert!(rec.symbols.iter().all(|s| s.name != "inner"));
        // Exported flags follow the declaration modifier.
        assert!(sym(&rec, "fnDecl").exported);
        assert!(!sym(&rec, "genDecl").exported);
        assert!(!sym(&rec, "letDecl").exported);
    }

    #[test]
    fn export_lists_and_default_identifier_mark_locals_exported() {
        let rec = ts(r#"function alpha() {}
const beta = 1;
function gamma() {}
function hidden() {}
export { alpha, beta as renamed };
export default gamma;
"#);
        assert!(sym(&rec, "alpha").exported);
        assert!(sym(&rec, "beta").exported, "export {{ beta as renamed }} marks LOCAL beta");
        assert!(sym(&rec, "gamma").exported, "export default <identifier>");
        assert!(!sym(&rec, "hidden").exported);
    }

    #[test]
    fn export_default_function_declaration_is_extracted() {
        let rec = ts("export default function boot() { return 1; }\n");
        let s = sym(&rec, "boot");
        assert_eq!(s.kind, "function");
        assert!(s.exported);
        // Anonymous default exports have no name to id.
        let anon = ts("export default function () { return 1; }\nexport default class {}\n");
        assert!(anon.symbols.is_empty());
    }

    #[test]
    fn declaration_merging_merges_ranges_exported_and_earliest_kind() {
        let rec = ts(r#"export interface Config { x: number }
const Config = { x: 1 };
function overload(): void;
function overload(x: number): void;
function overload(x?: number): void {}
"#);
        let merged = sym(&rec, "Config");
        assert_eq!(merged.kind, "interface", "earliest declaration's kind");
        assert!(merged.exported, "any exported declaration wins");
        assert_eq!(merged.range, [1, 2], "[min start, max end]");
        let overload = sym(&rec, "overload");
        assert_eq!(overload.kind, "function");
        assert_eq!(overload.range, [3, 5]);
        // Names are unique post-merge.
        assert_eq!(
            rec.symbols.iter().filter(|s| s.name == "Config").count(),
            1
        );
    }

    #[test]
    fn same_line_merge_tie_takes_kind_name_asc() {
        let rec = ts("interface Twin { x: number } const Twin = 1;\n");
        assert_eq!(sym(&rec, "Twin").kind, "const", "tie on start row: kind asc");
    }

    #[test]
    fn ranges_are_1_based_inclusive_rows() {
        let rec = ts("\n\nexport function down() {\n  return 1;\n}\n");
        assert_eq!(sym(&rec, "down").range, [3, 5]);
    }

    #[test]
    fn destructured_module_bindings_are_const_symbols() {
        let rec = ts(r#"const { da, db: renamed, ...rest } = obj();
const [ea, , eb = 4] = arr;
"#);
        for name in ["da", "renamed", "rest", "ea", "eb"] {
            assert_eq!(sym(&rec, name).kind, "const", "{name}");
        }
        assert!(rec.symbols.iter().all(|s| s.name != "db"), "pattern keys are not bindings");
    }

    #[test]
    fn ambient_declarations_unwrap_but_global_and_string_modules_do_not() {
        let rec = ts(r#"declare const ambient: number;
declare function ambientFn(): void;
declare global { interface Window { leak: 1 } }
declare module "some-mod" { export const leak2: number; }
"#);
        assert_eq!(sym(&rec, "ambient").kind, "const");
        assert_eq!(sym(&rec, "ambientFn").kind, "function");
        assert!(rec.symbols.iter().all(|s| s.name != "Window" && s.name != "leak2"));
    }

    #[test]
    fn import_name_conventions_default_named_alias_namespace_side_effect() {
        let rec = ts(r#"import def, { helper as h, other } from "./util";
import * as ns from "./components";
import "./styles.css";
import type { Conf } from "./conf";
"#);
        assert_eq!(rec.imports.len(), 4);
        let util = &rec.imports[0];
        assert_eq!(util.specifier, "./util");
        assert!(!util.reexport);
        let pairs: Vec<(&str, Option<&str>)> = util
            .names
            .iter()
            .map(|n| (n.source.as_str(), n.local.as_deref()))
            .collect();
        // Source names as written (not the local alias); default -> "default".
        assert_eq!(
            pairs,
            vec![
                ("default", Some("def")),
                ("helper", Some("h")),
                ("other", Some("other")),
            ]
        );
        let ns = &rec.imports[1];
        assert_eq!(
            ns.names.iter().map(|n| (n.source.as_str(), n.local.as_deref())).collect::<Vec<_>>(),
            vec![("*", Some("ns"))]
        );
        let side_effect = &rec.imports[2];
        assert!(side_effect.names.is_empty(), "side-effect import carries no names");
        let type_only = &rec.imports[3];
        assert_eq!(type_only.names[0].source, "Conf", "type-only imports are imports");
    }

    #[test]
    fn reexports_record_source_names_and_the_flag() {
        let rec = ts(r#"export { helper, other as pub } from "./util";
export * from "./merge";
export * as m from "./merge2";
"#);
        let named = &rec.imports[0];
        assert!(named.reexport);
        assert_eq!(
            named.names.iter().map(|n| n.source.as_str()).collect::<Vec<_>>(),
            vec!["helper", "other"],
            "source names as written at the target"
        );
        assert!(named.names.iter().all(|n| n.local.is_none()), "re-exports bind nothing locally");
        let star = &rec.imports[1];
        assert!(star.reexport);
        assert_eq!(star.names[0].source, "*");
        let ns_star = &rec.imports[2];
        assert_eq!(ns_star.names[0].source, "*");
    }

    #[test]
    fn require_and_dynamic_import_string_literals_only() {
        let rec = ts(r#"const req = require("./legacy.js");
const { ra, rb: rn } = require("./destructured");
require("./bare");
const dyn = import("./dynamic");
import(someVar);
require(someVar);
const tpl = require(`./template`);
"#);
        let specs: Vec<(&str, Vec<(&str, Option<&str>)>)> = rec
            .imports
            .iter()
            .map(|i| {
                (
                    i.specifier.as_str(),
                    i.names
                        .iter()
                        .map(|n| (n.source.as_str(), n.local.as_deref()))
                        .collect(),
                )
            })
            .collect();
        assert_eq!(
            specs,
            vec![
                ("./legacy.js", vec![("*", Some("req"))]),
                ("./destructured", vec![("ra", Some("ra")), ("rb", Some("rn"))]),
                ("./bare", vec![]),
                ("./dynamic", vec![("*", Some("dyn"))]),
            ],
            "non-literal arguments are not extracted"
        );
    }

    #[test]
    fn call_candidates_bare_identifiers_and_new_only_with_enclosing() {
        let rec = ts(r#"export function make() {
  const t = new Thing(1);
  helper(t);
  ns.member(t);
  obj.method();
  return inner();
}
topLevelCall();
"#);
        let calls: Vec<(&str, &str)> = rec
            .calls
            .iter()
            .map(|c| (c.enclosing.as_str(), c.name.as_str()))
            .collect();
        assert_eq!(
            calls,
            vec![("make", "Thing"), ("make", "helper"), ("make", "inner")],
            "member calls skipped; top-level statements have no enclosing symbol"
        );
    }

    #[test]
    fn type_ref_candidates_skip_declared_names_generics_and_qualified() {
        let rec = ts(r#"export function fn1(c: Conf): Widget { return build(c); }
interface Ext extends BaseI { y: Conf }
function generic<T>(x: T): T { return x; }
const qual: ns.Qualified = 1;
type Alias = Conf | Pair;
"#);
        let refs: Vec<(&str, &str)> = rec
            .type_refs
            .iter()
            .map(|c| (c.enclosing.as_str(), c.name.as_str()))
            .collect();
        assert_eq!(
            refs,
            vec![
                ("Alias", "Conf"),
                ("Alias", "Pair"),
                ("Ext", "BaseI"),
                ("Ext", "Conf"),
                ("fn1", "Conf"),
                ("fn1", "Widget"),
                ("generic", "T"),
            ]
        );
        // Declaration names never self-refer; qualified ns.Qualified is
        // not built (nested_type_identifier). Generic-param refs like T
        // are accepted name-based noise (gating drops them unless a
        // module-level T exists — the plan's minimal scope).
        assert!(!refs.contains(&("Ext", "Ext")));
        assert!(!refs.contains(&("Alias", "Alias")));
        assert!(!refs.iter().any(|(_, name)| *name == "Qualified"));
    }

    #[test]
    fn decorators_are_never_descended_into() {
        let rec = extract_src(
            Dialect::Ts,
            r#"function deco(x: any): any { return x; }
@deco
export class Decorated {
  m() { return helperInside(); }
}
"#,
        );
        // The decorator call is not a candidate; class members are not
        // extracted but their bodies still scan (helperInside is inside
        // the Decorated span).
        assert!(rec.calls.iter().all(|c| c.name != "deco"));
        assert!(rec
            .calls
            .iter()
            .any(|c| c.enclosing == "Decorated" && c.name == "helperInside"));
    }

    #[test]
    fn jsx_components_produce_no_candidates_but_arrow_consts_do() {
        let rec = extract_src(
            Dialect::Tsx,
            r#"import { Widget } from "./widget";
export const View = ({ c }: { c: Conf }) => <Widget conf={fmt(c)} />;
"#,
        );
        let s = sym(&rec, "View");
        assert_eq!(s.kind, "const");
        assert!(s.exported);
        // <Widget/> usage is not a candidate; fmt(c) inside the JSX
        // expression is.
        assert!(rec.calls.iter().all(|c| c.name != "Widget"));
        assert!(rec.calls.iter().any(|c| c.enclosing == "View" && c.name == "fmt"));
        assert!(rec.type_refs.iter().any(|c| c.enclosing == "View" && c.name == "Conf"));
    }

    #[test]
    fn js_dialect_shares_the_extractor() {
        let rec = extract_src(
            Dialect::Js,
            r#"const util = require("./util.js");
import def from "./x.js";
export function jsThing() { return def(util); }
export class JsClass {}
"#,
        );
        assert_eq!(sym(&rec, "jsThing").kind, "function");
        assert_eq!(sym(&rec, "JsClass").kind, "class");
        assert_eq!(sym(&rec, "util").kind, "const");
        assert_eq!(rec.imports.len(), 2);
        assert!(rec.calls.iter().any(|c| c.enclosing == "jsThing" && c.name == "def"));
    }

    #[test]
    fn import_equals_require_is_not_extracted() {
        let rec = ts("import legacy = require(\"./legacy\");\nexport const x = 1;\n");
        assert!(rec.imports.is_empty(), "TS import-equals form is on the not-extracted list");
    }

    #[test]
    fn syntax_errors_still_extract_what_parses() {
        // Whatever parses cleanly at module level still extracts; the
        // broken tail lands in error nodes without failing anything.
        let rec = ts("export const fine = 1;\nexport function alsoFine() {}\nfunction {{{ nonsense\n");
        assert!(rec.symbols.iter().any(|s| s.name == "fine"));
        assert!(rec.symbols.iter().any(|s| s.name == "alsoFine"));
    }
}
