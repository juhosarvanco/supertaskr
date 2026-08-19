---
id: T-043-s6
title: The body that pins "the measurement the whole card rests on" never asserts the child is a zombie, and its wait loop calls the try_wait its own comment forbids
status: suggested
suggested_by: verifier claude-opus-5 @T-043
---

Found by the T-043 adversarial verifier. The defect is small and the body
is currently correct on this machine — I measured that — but it is the
body the card names as its foundation, and it is green for a weaker
reason than it claims.

`a_zombie_answers_pid_alive_and_that_is_why_the_grace_needed_two_limbs`
(`app/src-tauri/tests/agent_runner.rs:713`) reads:

```rust
    let deadline = Instant::now() + Duration::from_secs(10);
    while g.child.try_wait().ok().flatten().is_none() && Instant::now() < deadline {
        // Spin WITHOUT reaping: `try_wait` would clear the zombie, which
        // is the state being measured. Fall through on the timer.
        std::thread::sleep(Duration::from_millis(500));
        break;
    }
    std::thread::sleep(Duration::from_millis(200));

    // THE ZOMBIE WINDOW: the process is dead and `kill(pid, 0)` says yes.
    assert!(nputer_lib::agent::runner::pid_alive(pid), …);
```

Three things:

1. **The comment forbids what the loop condition does.** It says spinning
   must not `try_wait`, because that would reap the zombie the body is
   measuring — and the loop condition IS a `try_wait`. It is harmless
   only because the child has not usually died in the microseconds
   between the `kill` and the first evaluation. If it has, the child is
   reaped there and the assertion below reds spuriously.
2. **The loop can never iterate twice**, so `deadline` is unreachable
   dead code and the 10 s bound it appears to provide does not exist. The
   body is really `sleep(500); sleep(200)`.
3. **Nothing asserts the child is actually a zombie.** `pid_alive` is
   `kill(pid, 0)`, which is equally true for a process that is simply
   still running. If the `sleeper` fixture ever became slow to die, or
   700 ms stopped being enough on a starved runner, the body would stay
   GREEN while measuring "an alive process answers `kill(pid,0)`" — a
   fact nobody doubts — instead of the zombie fact the whole two-limb
   design rests on.

**Measured, so the report is not speculation.** Instrumenting the body to
sample `ps -o stat=` immediately before the assertion, three runs:

```
PROBE zombie-state pid=34417 stat="Z"
PROBE zombie-state pid=34426 stat="Z"
PROBE zombie-state pid=34435 stat="Z"
```

It really is a zombie today. The body just does not check.

**Recommendation.** Replace the pseudo-loop with the fact itself: poll
until the child is dead-but-unreaped and assert THAT, rather than
sleeping and hoping. The cheapest honest form is to keep the timed wait
but add the state check the body's own headline claims —

```rust
let state = std::process::Command::new("/bin/ps")
    .args(["-o", "stat=", "-p", &pid.to_string()]).output()…;
assert!(String::from_utf8_lossy(&state.stdout).trim().starts_with('Z'),
        "the fixture is not in the zombie state this body measures");
```

— or restructure so the reap is observed rather than timed. Either way,
delete the unreachable `deadline` and fix the comment so it describes the
code.

Suggested size S. Touches `app-agent` tests only.
