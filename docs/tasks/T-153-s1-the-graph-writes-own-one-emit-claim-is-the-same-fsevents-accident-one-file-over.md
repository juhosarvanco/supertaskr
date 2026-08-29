---
id: T-153-s1
title: index_cmd's "one write, one emit — no echo" is the same FSEvents accident T-153 removed from docs_watch, asserted this time as a property
status: suggested
suggested_by: executor claude-opus-5 @T-153
---

`index_cmd::tests::reindex_emits_once_then_never_again`
(app/src-tauri/src/index_cmd.rs) takes THE NEXT emit off the watcher
channel and requires it to carry the freshly written
`docs/architecture/graph.json`:

    let emit = emits
        .recv_timeout(Duration::from_secs(10))
        .expect("the graph write must emit exactly one snapshot");

then asserts that NOTHING follows it:

    assert!(emits.recv_timeout(DEBOUNCE * 6).is_err(), "one write, one emit — no echo");

This is the exact assumption T-153 took out of every T-018 live body in
`docs_watch.rs` — with one difference that is why this card exists
rather than a sweep line: **here the one-emit-ness is the CLAIM, not an
incidental convenience.** Converting it to a recv-until-predicate would
delete the property the body is about, so it is a judgement call and not
a mechanical fix, and T-153's executor routed it instead of taking it.

## WHY IT HAS NOT BITTEN YET, DERIVED RATHER THAN ASSUMED

It passed the repository's first CI run (`33246335429`) and the T-153
lane's run (`33252279564`), both on ubuntu/inotify. The reason is a
property of the FIXTURE and not of the assertion: the body's `TempTree`
holds one four-line `src/a.ts`, so the graph it writes is small enough
that the write is a single `write(2)` and therefore a single `IN_MODIFY`.
The measured failure in `docs_watch.rs` needed a **1 MiB** write to split
across a debounce window.

The live repository's own `graph.json` is 989 181 bytes (T-139's
measurement, `13c736e`) — the same order as the write that broke the
sibling body. Nothing in this test's fixture grows toward that today;
what would change the answer is a fixture that indexes a real tree, or a
slower runner.

## THE TWO SHAPES A FAILURE WOULD TAKE

1. The first emit carries a PARTIAL `graph.json`. `"schema": 1` is near
   the start of the file, so `graph_file.content.contains("\"schema\": 1")`
   can pass on a truncated payload — the assertion would go GREEN on a
   snapshot the app could not parse.
2. The converged emit then arrives inside the `DEBOUNCE * 6` window and
   reds `"one write, one emit — no echo"` — a true statement about the
   backend reported as a defect in the watcher.

Shape 1 is the worse one, because it is silent.

## Disposal

`touches:` `[app-shell]` — `index_cmd.rs` is C-05's (its component file
claims it: *"the shell's own command bodies"*). Two arms, and they are
not exclusive:

- **(a)** Split the claim in two. Wait for the CONVERGED graph
  (`serde_json` parses it, or its byte length equals what the writer
  wrote), then assert no FURTHER emit follows. That keeps the no-echo
  property while removing the assumption that the first emit is the
  converged one.
- **(b)** Strengthen shape 1's assertion regardless: compare the emitted
  `graph.json` against the bytes on disk rather than searching it for a
  substring near its head.

T-153's `recv_until` (app/src-tauri/src/docs_watch.rs, test module) is
the primitive (a) wants; it is `#[cfg(test)]` inside another module's
test mod, so taking this card means either moving it to a shared test
helper or writing the two-line equivalent locally.
