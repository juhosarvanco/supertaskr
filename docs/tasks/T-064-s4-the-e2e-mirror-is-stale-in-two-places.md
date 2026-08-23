---
id: T-064-s4
title: The E2E lane's hand-written payload mirror is stale in TWO places — it declares a `probe` T-064 removed and is missing the `deadline` step T-063 added, and neither staleness can red anything
status: suggested
suggested_by: executor claude-opus-5 @T-064
---

`tools/e2e/fixtures/shell.ts` carries hand-written mirrors of the app's
payload types. Nothing derives them from `app/src/lib/watcher-store.ts`
and nothing compares them to it, so they go stale silently — which is
T-065's subject ("one wire, one shape") measured on two live instances.

**INSTANCE ONE, T-064's own doing.** The mirror's genesis variant reads

    | { kind: "genesis"; projectDir: string; seq: number; probe: PlanProbePayload }

and `tools/e2e/tests/genesis-screen.spec.ts` sends `probe:` on both of
its genesis payloads. T-064 removed `probe` from
`PickOutcome::Genesis` on both real sides (Rust and `app/src`). The
lane stays GREEN — **measured, 121/121 at exit 0 with the field gone**
— because the reducer reads only what it names and a structured-cloned
extra key is inert. So the mirror now teaches a wire shape that does
not exist, and the only cost is to the next reader.

**INSTANCE TWO, ALREADY THERE BEFORE T-064 AND OLDER BY A CARD.**
`tools/e2e/fixtures/shell.ts:54` reads

    /** T-050: which of the two startup awaits refused. */
    export type StartupStep = "subscribe" | "snapshot";

T-063 added a THIRD — `"deadline"` — in
`app/src/lib/watcher-store.ts`, and the comment still says "the two".
`tools/e2e/tests/startup-recovery.spec.ts` never drives the deadline
step, so nothing on either side reds. This is the same mechanism as
instance one, and it is evidence that the mirror drifts by default
rather than exceptionally: **two cards, two omissions, zero red
suites.**

**NOT FIXED HERE**: `tools/e2e` was T-061's fence this week, and both
edits are in it. Whoever takes it should weigh doing the mirror ONCE
and derivably (T-065) rather than patching two entries — and should
land `T-064-s3`'s `StartupFailure` move in the same pass, since it
touches the third mirror line (`shell.ts:72`) and the one `toEqual`
that pins it.
