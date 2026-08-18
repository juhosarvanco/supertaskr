---
title: "\"the re-subscribe does not FIGHT the pick's own snapshot\" stays GREEN when the re-subscribe is deleted"
status: suggested
suggested_by: verifier claude-opus-5 @T-063
---

Found by the verifier's implementation-poison sweep, and it is the same
defect class T-063 itself names and closes elsewhere: **a test
parametrised by the thing it claims to pin.** Here the parameter is not a
constant — it is the mechanism's own absence.

`app/test/startup-recovery.test.ts`, criterion 2's family:

    it("the re-subscribe does not FIGHT the pick's own snapshot — a STALE
        pull drops by identity", ...)

Deleting the re-subscribe from `commitPickOutcome`
(`app/src/lib/watcher-store.ts`, the
`before.startupFailure?.step === "subscribe" && ...` block) reds **4** of
that describe's tests — and this one **stays green**:

    RED  the board is LIVE afterwards, not a photograph
    RED  ...and a NEWER pull applies, exactly like any other snapshot
    RED  a GENESIS pick re-subscribes too — and the status pull must not
         yank the interview away
    RED  the interview's own docs, when they DO land, still reach it
    ---  the re-subscribe does not FIGHT the pick's own snapshot   GREEN

The reason is structural rather than accidental. The test arranges a pick
at `seq 9` and a status pull at `seq 4`, then asserts `docs.seq === 9`,
the pick's tree intact, and exactly one `model-updated` echo. **All three
are equally true when no status pull happens at all** — which is what
deleting the mechanism produces. The assertions describe the OUTCOME of
the seq guard, and "no second payload" and "a second payload dropped by
identity" have the same outcome by construction. That the identity-drop
is invisible from outside is precisely the property T-063's own criterion
1 comment explains, and the instrument it prescribes there is a COUNT.

**Nothing is broken in the shipped app.** Its sibling ("...and a NEWER
pull applies") does discriminate, and the interleaving really is settled
by the seq guard — verified. What is wrong is that a test whose title
names the interleaving cannot see whether the interleaving happened. If
the sibling were ever weakened or deleted, this one would go on reporting
green over a criterion nobody was testing.

**Closers, cheapest first.**
(a) Assert `ipc.invokeCalls === 2` in that test — one pull at startup, one
    from the re-subscribe. One line, and it turns the test into one that
    can only pass when the pull actually happened.
(b) Additionally keep the existing one-echo assertion, so "one echo" means
    "a second payload arrived and was dropped" rather than "nothing
    arrived".
(c) Leave it and rely on the sibling — the status quo, and the one this
    file exists to make visible.

(a) is right and costs a line. It is also worth a sweep of the same shape
elsewhere in this store's suites: the question to ask of any
outcome-shaped assertion here is "would this still pass if the payload
never arrived?", because the seq/identity guards are designed to make
those two cases look the same from outside.
