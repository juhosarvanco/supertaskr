---
title: Two measured figures written into T-063 do not reproduce — the log line is 870 characters, not 887, and the debasement was 9 of 15, not 10 of 23
status: suggested
suggested_by: verifier claude-opus-5 @T-063
---

Both of T-063's mechanisms hold. Both of these are **arithmetic in the
record**, and this repo's whole discipline is that a quoted figure
reproduces — it is the lesson STATE already carries for `EXPECTED_GRANTS`
(three agents, three byte counts) and the one T-063-s1 files against the
bundle size. Two of T-063's own figures are the same shape.

## 1. "887 characters" is 870 characters (872 bytes)

T-063's implementation notes quote a real `tauri dev` run:

> **887 characters, zero raw control bytes, the cap's own marker present.**

Re-run end to end today with an independent temporary probe through the
same path (real `emit` to real `app.listen` to real `eprintln!` to the
real process's stderr; probe removed afterwards and `watcher-store.ts`
restored to sha256 `f1936907ec9a6dfb56bee786154cf35fe7421a6655d852a7d94f1c5b3c021205`).
Every qualitative claim reproduced exactly — zero raw control bytes, the
ESC legible as its six-ASCII-character JSON escape, the truncation marker
present, one line. **The count did not.**

    prefix          58 chars   ("[nputer] startup-failed: recv_at_ms=" 36
                                + 13-digit stamp + " payload=" 9)
    capped body    800 chars   (MAX_ECHO_LOG_CHARS, docs_watch.rs:60)
    marker          12 chars   (the ellipsis + "(truncated)")
    TOTAL          870 chars / 872 bytes

**The length is content-independent once the cap fires** — any message of
800+ characters gives the same 870, for any 13-digit `recv_at_ms`. So 887
is not a different-message figure; it cannot be produced by this code at
all. The notes' own quoted line carries a 13-digit stamp, so the run that
produced it should have measured 870 too.

Nothing about the SAFETY claim moves: the cap fired, the marker is there,
no raw control byte reached the terminal, and the escaping-versus-cap
correction the notes make to the card's mental model is exactly right.
Only the number is wrong.

## 2. "10 of these 23 tests" is 9 of 15

`app/test/startup-screen.test.tsx:9-13` carries the measurement that
T-063-s4 is about:

> (Measured: a value import turned 10 of these 23 tests red with phase
> "browser".)

The file has **15** tests (`npx vitest run test/startup-screen.test.tsx`
gives `15 passed (15)`; 11 at `2fc3475` plus T-063's four). T-063-s4's own
body says "10 of the file's 15 tests", so **the comment and the
suggestion file disagree with each other**, and re-running the poison
today gives a third number: a genuinely used top-level value import
(`import { STARTUP_DEADLINE_MS as POISON_N, ... }`, referenced once so it
survives elision) reds **9 of 15**, with exactly s4's signatures —
`expected 'browser' to be 'loading'` and
`expected [ 'Toggle theme' ] to deeply equal [ 'Toggle theme', 'trying...', ...(2) ]`.

**And the drill sharpens s4's claim in a way worth writing down.** The
first attempt at this poison — the same import with the binding left
UNUSED — came back **15 passed**: TypeScript elides an import whose
bindings are all unused, so the store is never loaded and nothing is
debased. The hazard therefore needs the imported value to be genuinely
USED, which is exactly the case s4 hit and exactly the case a future
editor will hit. s4's closer (b) (one `isTauriRuntime() === true`
tripwire in `beforeAll`) is unaffected and is still the cheap answer.

## Disposition

One line each: correct the two figures in place (a card body is a
historical record, but a wrong arithmetic in a record is not history, it
is a wrong number the next reader will trust), or rule with T-063-s1 that
figures inside a closed card are frozen. It should be somebody's call
rather than nobody's — which is s1's disposition too, so the two belong
in one ruling.
