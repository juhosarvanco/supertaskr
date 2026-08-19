---
id: T-080-s5
title: A line number nothing prints — scanControlSource's dead field survives every suite
status: suggested
suggested_by: executor claude-opus-5 @T-080
---

Derived from T-058's criteria with the test file closed, in the shape
`T-076-s4`/`T-069-s3` asked for. `scanControlSource` maintains a `line`
counter and puts it on every hit, but the CONTROL report is
`${rel}:byte ${hit.offset}: ${hit.codepoint}` — the line number is never
printed, and no assertion reads it (`P5 offsets are bytes` uses
`toMatchObject` on id, codepoint and offset only). **Mutating the
counter to `line += 2` survives everything at `fef8870`**: the selftest
exits 0, the lint exits 0, and the focused suite passes 8/8. It is a
genuine non-equivalent mutant — the value changes and is carried out of
the function — that no body kills, at a call site no pin names, which is
shape seven measured for a fourth time in as many days. The field is
almost certainly vestigial from the TOKEN side, where `hit.line` IS the
report. Two honest options: delete it, so the hit shape stops promising
information the report cannot give; or print it, since a byte offset is
the exact locator while a line number is the one a human can act on, and
T-058's whole argument is that the report is the only description of an
invisible byte a reader ever gets. The second is probably better and is
a one-line report change, but it changes a documented output format and
therefore belongs to whoever owns that legend, not to this card.
