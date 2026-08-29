---
id: T-010-s9
title: The cargo-prefixed package qualifier closes the id collision from the Rust side only, and a TS specifier can still land on the same node
status: parked
suggested_by: verifier claude-opus-5 @T-010-verify
---

T-010's notes argue that qualifying cargo package names closes the
cross-ecosystem id collision **"by construction rather than by a
population anyone could enumerate"**. The qualifier is the right call and
the collision it was aimed at is genuinely closed. But the claim is one
side too strong, and this file carries the measurement rather than the
argument.

## The case, built rather than reasoned about

A two-file tree, indexed at lane tip `cb13957` with
`nputer-index index --root .`:

    Cargo.toml   [package] name = "collide"
    src/lib.rs   use serde::Serialize;
    src/a.ts     import { Serialize } from "cargo:serde";

The emitted graph carries **ONE** package node:

    {"id": "p:cargo:serde", "name": "cargo:serde", "ecosystem": "npm"}

…with edges into it from **both** files. `resolve::ts::is_unsupported`
rejects `http:`, `https:`, `data:` and a leading `/`, and nothing else, so
a `cargo:`-prefixed specifier falls through to `package_ref`, which
returns `(name, "npm")` verbatim. The Rust side then finds the id already
present and `or_insert` leaves it alone.

**The ecosystem label is decided by filename order.** Renaming `src/a.ts`
to `src/z.ts` and re-running flips the same node to
`{"ecosystem": "cargo"}`, because `records` is a `BTreeMap` keyed by
root-relative path and first-writer wins. Deterministic — the graph is
still byte-reproducible — but arbitrary, and silently so.

## Why it does not light anything

`app/src/lib/architecture/graph.ts` validates `id === "p:" + name` (which
holds) and reports **duplicate** package ids (there is only one node). So
the derivation reports **no issue at all**: this is a silent
misclassification, not a loud one. That is the opposite of the
`node:fs` precedent's behaviour, which the notes correctly cite as the
shape being copied.

## How reachable it is, stated honestly

An npm package cannot be named `cargo:serde`, so this cannot arise from a
real dependency. It needs a TS/JS file that literally writes a
`cargo:`-prefixed specifier — a virtual-module convention a bundler
plugin could plausibly adopt (`virtual:`, `astro:`, `unplugin:` all exist
in the wild) but that no working `cargo:`-prefixed toolchain does today.
**Latent, not live** — the same standing ADR-015's addendum gives its own
two-engine divergence.

## The fix, and the reason it is small

Reserve the qualifier on the TS side rather than only minting it on the
Rust side: `is_unsupported` — or a dedicated check in `package_ref` —
should refuse a specifier whose scheme is one the graph mints itself
(`cargo:`, and `node:` already has its own branch), so it lands in
`unresolved[]` with a reason instead of impersonating a package node. The
closed reason taxonomy already has `unsupported`.

A test wants BOTH directions: the `.ts`-first and the `.rs`-first
orderings, since only running one of them cannot tell a fix from a
coincidence of sort order.

Amnesty triage 2026-08-29 (triage seat): PARKED — the needle is live — resolve/ts.rs's is_unsupported still rejects only /, http:, https: and data:, so a cargo:-prefixed TS specifier still lands on the minted package node — but the card measures its own reachability as latent, not live: no npm package can be named cargo:anything and no shipping toolchain writes that specifier. RESURFACES: the next crate-index dispatch, or the first real cargo:-prefixed specifier in any indexed tree.
