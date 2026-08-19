---
id: T-046-s4
title: The boot-check guard's "never names 1420" assertion is a substring test over an OS-assigned port — it flakes at ~1 in 8192, and it flaked
status: suggested
suggested_by: integrator claude-opus-5 @T-082
---

**Observed failing, once, during T-082's integration at `7a37b37`** — not
reproduced from reasoning. `tools/e2e/tests/boot-check-guard.spec.ts:144`:

```ts
// The override reached the probe: the abort names the overridden port,
// so the env var is honoured end-to-end, not just in the resolver.
expect(stderr).not.toContain("1420");
```

The test asks the OS for an ephemeral port (`server.listen(0, …)`),
holds it, and requires the boot check to abort naming **that** port
rather than 1420. The intent is exactly right and the guard is worth
having. The spelling is a **substring test against a number the test
does not choose**.

The OS handed it **61420**. `"61420".includes("1420")` is true, so the
assertion failed on a run where the boot check had behaved perfectly —
the abort message names port 61420 and never mentions 1420 as a port at
all.

Measured, not estimated. macOS ephemeral range is 49152–65535 = 16384
ports; exactly **two** of them contain `1420` as a substring — **51420**
and **61420**. So the flake rate is **2/16384 ≈ 0.0122%, about 1 in
8192 runs** of this one test. A re-run passed 6/6 immediately.

The assertion has been in place since T-046 (`9b2832b`) and this is its
first observed failure, which is consistent with the rate.

**Why this is worth a card rather than a shrug.** It is the archive's
**poison shape 1 inverted** — "the matcher moved, the value stayed",
where a `toContain` needle is still a substring of the new value. Here a
`not.toContain` needle is a substring of a legitimately *different*
value. The catalogued shape is about assertions that keep passing when
they should fail; this is the same defect producing the opposite
symptom, and the catalogue does not yet name that direction.

It is also the exact class T-083 is about: **a check that is right about
the intent and wrong about the mechanism**, where the wrongness is
invisible until an input hits the narrow band that exposes it.

**The fix is to compare the thing the test means.** The assertion means
"the abort did not name the human's port", and the port is a number, not
a substring of a message. Options, in the order I would take them:

1. Assert on the **structured** fact — that the abort names `${port}`
   and that `DEFAULT_TAURI_PORT` does not appear **as a port token**
   (word-boundary or delimiter-anchored), rather than as any substring.
2. Reject the two colliding ports at selection time and re-request —
   cheap, but it leaves a substring test standing and the next reader
   inherits the same trap.
3. Keep the substring test and pin the port, losing the "OS-assigned so
   never something else's" property the comment relies on. Not
   recommended — that property is why the test is safe beside a live app.

**A second instance of the same shape lives four lines up** and should
be checked while someone is here: `boot-check-guard.spec.ts:118`'s
`expect(stdout).not.toContain("free")` is a substring test over prose,
and any future message containing "free" — "freed", "port is free" —
reds a passing run for the same reason.

Whoever takes this should sweep the e2e suite for `not.toContain` over
values the test does not author; that is the general shape, and two
instances in one file suggests it is a habit rather than an accident.
