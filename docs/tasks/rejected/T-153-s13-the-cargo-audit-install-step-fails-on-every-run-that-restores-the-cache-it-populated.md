---
id: T-153-s13
title: The cargo-audit install step fails on every run that restores the cache the previous run populated, so CI is hard-blocked at step 19 for the whole repository — main pushes included
feature: F-01
milestone: 4
priority: 1
size: S
status: rejected
blocked_by: []
touches: [.github/workflows/]
suggested_by: executor claude-opus-5@subagent @T-153-s9
builder:
verifier:
built_by:
verified_by:
review:
---

## The measurement — two runs on ONE commit, one difference, and the difference is the cache

| run | started | cargo cache | `install cargo-audit` | what ran after |
|---|---|---|---|---|
| 33275876129 | 21:21Z | `Cache not found for input keys: cargo-Linux-740f9629d9d8…` | success | everything, through the e2e lane |
| 33277133108 | 21:51Z | `Cache hit` / `Cache restored from key: cargo-Linux-740f9629d9d8…` | **exit 101** | nothing — eight steps SKIPPED |

The message, verbatim:

    error: binary `cargo-audit` already exists in destination
    Add --force to overwrite

## The mechanism

`.github/workflows/ci.yml` caches `~/.cargo/bin` (alongside
`~/.cargo/registry`, `~/.cargo/git` and `app/src-tauri/target`) under
`cargo-${{ runner.os }}-${{ hashFiles('app/src-tauri/Cargo.lock') }}`,
and later runs `cargo install cargo-audit --locked` with no `--force`
and no "is it already there" guard.

So the FIRST run on a given `Cargo.lock` misses the cache, installs
cargo-audit into `~/.cargo/bin`, and SAVES that binary into the cache.
**Every subsequent run on the same `Cargo.lock` restores it and then
tries to install over it, which `cargo install` refuses.** The step is
not `continue-on-error`, so the job stops there and every step behind it
— `cargo audit`, `e2e install`, the docs gate, `e2e types`, the browser
install, **the e2e lane** and the xvfb boot — is skipped.

**IT IS NOT A LANE PROBLEM AND NOT A PR PROBLEM.** The key carries no
event, no branch and no ref: a push to main hits it exactly as a
pull_request does. The repository's CI is blocked until the cache entry
is evicted (GitHub's 7-day / 10 GB eviction), `app/src-tauri/Cargo.lock`
changes the key, or this step is fixed.

**THE PATTERN IS SELF-RESTORING IN THE WRONG DIRECTION**, which is worth
naming: deleting the cache entry buys exactly ONE green run, because that
run misses, installs, and saves the poisoned cache again.

## Why it is worth a card rather than a rerun

`T-153-s9` exists because the ONE instrument a lane is given to run CI
with was manufacturing reds. This is the same failure one layer out and
strictly worse: that one produced twenty-nine wrong verdicts, this one
produces NO verdict at all, on every run, for every seat. It was found
by `T-153-s9`'s second CI cycle, which is the first time this repository
ran twice against one `Cargo.lock` since main's first green push
populated the cache.

## What it would take

The step is three words from correct — `--force`, or `cargo install
--locked cargo-audit || true` (no: that hides a real failure), or the
honest shape: only install when the binary is absent. `--force` is the
smallest change that keeps the pin honest, since `--locked` still
resolves the exact versions and a re-install of the same version is a
no-op in effect if not in cost. The alternative that costs nothing at
run time is to drop `~/.cargo/bin` from the cache PATH list: the binary
is the only thing in it that this job installs, and re-installing it on
a cache hit is what the current shape is trying to avoid.

**WHICHEVER IS CHOSEN, THE FIX IS NOT PROVEN BY ONE GREEN RUN.** It is
proven by TWO consecutive runs on one unchanged `Cargo.lock` — a cache
miss and then a cache hit — because the defect only exists on the second.
`tools/e2e/tests/workflow-parity.spec.ts` already pins this file's step
list against CONVENTIONS and is the place a static half would live.

**FENCE.** `.github/workflows/` — outside `T-153-s9`'s `tools/e2e`, which
is why it is routed rather than fixed where it was found.

Discharged: closed_by 129e3c9 (2026-08-30, integrator) — the guard landed on main directly under the CI-green authorization before this card could reach a lane; this card arrived with the s9 merge already satisfied.

Standing triage 2026-08-30 (architect seat): REJECTED — DISCHARGED, NOT DECLINED — the work landed at `129e3c9`. Verified at this ref: the commit exists on this base, and `.github/workflows/ci.yml:176` now runs `command -v cargo-audit >/dev/null 2>&1 || cargo install cargo-audit --locked`, which is the "only install when the binary is absent" shape this card named as the honest fix. The cache-hit path the card measured — `cargo install` refusing over a restored binary at step 19 — can no longer be reached. Recorded here rather than as an absorption because the resolver is a direct-to-main CI commit under the CI-green authorization and no task card exists to carry an Absorbs line — the case TASK-FORMAT names as forcing this wording.
