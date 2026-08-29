---
id: T-126-s1
title: The lane wire gained a wrapper type and the TypeScript mirror does not know it exists — dispatch-store.ts types LaneScan and the command returns something one level up
status: parked
suggested_by: executor claude-opus-5 @T-126
---

`dispatch_lanes` (T-126, `app/src-tauri/src/lib.rs`) returns
`DispatchLanesOutcome`, not `LaneScan`:

    { kind: "noProject" }
    { kind: "answered", scan: <LaneScan> }

`app/src/lib/dispatch-store.ts` mirrors `LaneScan` and its four refusals
faithfully and has **no type for the outer shape at all**. A webview
call today would hand back an object whose `kind` is `answered` where
every mirrored union expects `scanned` / `notAGitRepository` /
`gitIsAFile` / `noWorktreesDirectory` / `worktreesUnreadable`.

## Why the wrapper exists rather than a sixth LaneScan kind

`LaneScan` answers about a FOLDER and every one of its five answers
presumes there is a folder. "No project is open" is a fact about the
APP — the `ChurnDisabled::NoProject` precedent — and collapsing the two
would tell a user with no project open that their project is not a git
repository, which is the exact failure `LaneScan`'s own header exists to
prevent (*"no two of them are the same empty list"*).

Adding the variant to `LaneScan` instead was NOT chosen and the reason is
a fence, not a preference: `app/src-tauri/src/dispatch/**` is C-15's
`app-dispatch` and T-126's `touches:` is `[app-shell]` alone.

## What is owed

One exported type in `app/src/lib/dispatch-store.ts` mirroring the
wrapper, beside the existing `LaneScan`. **Nothing is broken today**:
this is a live-but-unreachable defect, because no frontend file invokes
the command yet (T-126's own census asserts `dispatch_lanes` is absent
from `frontendCommands()`). It becomes real the first time anything
calls it — which is `T-111`'s territory.

**And it is worth deciding rather than mirroring by reflex.** The
alternative is to move the wrapper INTO C-15 as a sixth `LaneScan` kind,
which puts one type where one fence owns it and deletes this finding
instead of implementing it. That is a ruling about where the "no project"
fact belongs, and it belongs to whoever holds `[app-dispatch]`.

## Fence

`[app-dispatch]`, or `[app-dispatch, app-shell]` if the wrapper is moved
into C-15 rather than mirrored. Free at the time of writing.

Amnesty triage 2026-08-29 (triage seat): PARKED — live-but-unreachable, by the card's own census: no frontend file invokes dispatch_lanes yet, so the missing wrapper type costs nothing today. And the card is right that mirroring it by reflex would be the wrong move — the alternative is to fold "no project is open" into C-15 as a sixth LaneScan kind, which puts one type where one fence owns it and DELETES this finding instead of implementing it. That is a ruling about where the fact belongs. RESURFACES: the first frontend call of dispatch_lanes — T-112's territory, and the ruling belongs to whoever holds [app-dispatch] when it happens.
