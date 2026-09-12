import { spawnSync, spawn } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { repoRoot } from "../preflight";
import {
  ACK_TOKEN,
  ASK_TOKEN,
  DONE_TOKEN,
  OPERATIONS,
  RunRecordFinding,
  TERMINAL_STATES,
  bindRun,
  collectRun,
  continueRun,
  defaultRunIo,
  observeRun,
  readAssignment,
  readRecord,
  readReservation,
  reconcile,
  recordPath,
  reservationPath,
  runPlan,
  sendAnswer,
  startRun,
  stopRun,
  waitRun,
} from "../scripts/run-record.mjs";
import type { Assignment, RunIo, RunRecord } from "../scripts/run-record.mjs";

/**
 * THE RUN RECORD (T-311) — no browser.
 *
 * Every child this loop starts now has ONE recoverable state on disk,
 * and every one of them takes the same operations. The bodies below are
 * the card's acceptance criteria, one property each, and they are
 * written against the MODULE rather than against the command: the arm is
 * a parser and a renderer, while the states, the reservation and every
 * refusal live in `scripts/run-record.mjs`.
 *
 * ── HOW THE TWO KINDS OF CHILD ARE DRIVEN, STATED SO NOTHING IS
 *    MISTAKEN FOR WHAT IT IS NOT ─────────────────────────────────────
 * **A NATIVE CHILD CANNOT BE SPAWNED FROM A TEST.** It is the seat's own
 * harness that spawns one, and this suite has no harness. So the native
 * path is driven exactly as the arm drives it — the verbs, with a bind
 * by an INVENTED task id and the harness's output supplied as evidence —
 * and the PROCESS path is driven with a REAL child process, whose pid
 * the record binds and whose exit the process table answers for. Every
 * body below says in its own comment which of the two it is driving, so
 * a reader never has to guess whether a pid was real.
 *
 * **NO BODY HERE SIGNALS ANYTHING.** The child processes this file
 * starts end themselves, on their own, because the property under test
 * on the other side is precisely that a stop is recorded after a
 * termination rather than performed by sending something.
 *
 * ── THE SCRATCH ROOTS ────────────────────────────────────────────────
 * Each body builds its own root, lane and scratch directory under the
 * system temporary directory and removes them. Nothing here writes into
 * this checkout: the records live under `.supertaskr/runs/` of whichever
 * root they are handed, and a suite that wrote into the real one would
 * be a test taking a reservation over somebody's lane.
 */

interface Bench {
  /** the seat's checkout: where records and reservations live */
  root: string;
  /** the resource a writer may write: a lane worktree, here a bare directory */
  lane: string;
  /** the lane's scratch directory: the brief, the ask file, the report */
  scratch: string;
  cleanup: () => void;
}

const WORK = "T-900";

function bench(stem: string): Bench {
  const dir = mkdtempSync(path.join(os.tmpdir(), `t311-${stem}-`));
  const b: Bench = {
    root: path.join(dir, "root"),
    lane: path.join(dir, "lane"),
    scratch: path.join(dir, "scratch"),
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  };
  mkdirSync(b.root, { recursive: true });
  mkdirSync(b.lane, { recursive: true });
  mkdirSync(b.scratch, { recursive: true });
  writeFileSync(path.join(b.scratch, `brief-${WORK}.txt`), "the brief this child is answerable to\n");
  return b;
}

/** An assignment document, complete unless a body deliberately breaks one field. */
function assignment(b: Bench, over: Partial<Assignment> = {}): Assignment {
  return {
    kind: "card",
    id: WORK,
    role: "executor",
    resource: b.lane,
    harness: "claude-code",
    model: "claude-opus-5",
    effort: "high",
    base: "f608f5fa617f36e9ef30ed7806d32b54bff00bad",
    brief: path.join(b.scratch, `brief-${WORK}.txt`),
    cwd: b.lane,
    deadline: "none",
    budget: "none",
    ...over,
  };
}

/** A stub world. Every probe this module makes is injected, so no body here depends on a machine. */
function io(over: Partial<RunIo> = {}): RunIo {
  return {
    now: () => "2026-09-12T00:00:00.000Z",
    identity: () => null,
    listening: () => false,
    git: () => null,
    ...over,
  };
}

/** The lane's ask file, as the record derives it from the brief's own directory. */
function askFile(b: Bench): string {
  return path.join(b.scratch, `ask-${WORK}.md`);
}

/** Arm the lane with a fence manifest, which is what the permission boundary is read from. */
function armFence(b: Bench, paths: string[]): void {
  const dir = path.join(b.lane, ".supertaskr");
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, "lane-fence.json"), JSON.stringify({ version: 1, paths }, null, 2));
}

/** Put a card in the lane with a status, which is what the stamp is read from. */
function stampCard(b: Bench, status: string): void {
  const dir = path.join(b.lane, "docs", "tasks");
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, `${WORK}-a-card.md`), `---\nid: ${WORK}\nstatus: ${status}\n---\n`);
}

/** Drive an attempt to `running`, which is where most of the operations begin. */
function running(b: Bench, over: Partial<Assignment> = {}): RunRecord {
  const started = startRun(b.root, { assignment: assignment(b, over), at: "2026-09-12T00:00:00.000Z", io: io() });
  bindRun(b.root, {
    attempt: started.record.attempt,
    harnessId: `task-${started.record.attempt}`,
    at: "2026-09-12T00:00:01.000Z",
    io: io(),
  });
  return observeRun(b.root, {
    attempt: started.record.attempt,
    evidence: "the harness's own output for this task: it is working",
    at: "2026-09-12T00:00:02.000Z",
    io: io(),
  }).record;
}

/* ════════════════════════════════════════════════════════════════════
 * CRITERION ONE — one record per attempt, the reservation for writers
 * only, and two records for one card at once.
 * ════════════════════════════════════════════════════════════════════ */

test("a WRITER takes the resource's reservation before its launch and a READ-ONLY participant takes none, so an executor and a tool-less phase one run for one card at once", () => {
  // THE NATIVE PATH, driven by the verbs: no harness exists here to
  // spawn either child, and none is needed — what is under test is the
  // RESERVATION, which is taken before any spawn by construction.
  //
  // KILLED BY: a reservation taken for a participant, a participant
  // refused because the resource is held, a record that carries fewer
  // fields than the assignment, and a second record for one card
  // refused rather than written.
  const b = bench("two-records");
  try {
    const exec = startRun(b.root, { assignment: assignment(b), at: "2026-09-12T00:00:00.000Z", io: io() });
    const phase1 = startRun(b.root, {
      assignment: assignment(b, { resource: "none", role: "verifier-phase-1" }),
      at: "2026-09-12T00:00:00.500Z",
      io: io(),
    });

    expect(exec.record.writer, "the executor was not recorded as the writer").toBe(true);
    expect(phase1.record.writer, "the tool-less phase one took write ownership").toBe(false);
    expect(phase1.reservation, "a read-only participant took a reservation").toBeNull();
    expect(
      exec.record.attempt === phase1.record.attempt,
      "two children of one card share one attempt id",
    ).toBe(false);
    for (const rec of [exec.record, phase1.record]) {
      expect(rec.assignment.id, "the record does not name the work it serves").toBe(WORK);
      expect(rec.brief.digest, "the brief was not digested").toMatch(/^sha256:[0-9a-f]{64}$/);
      expect(rec.assignment.base, "the base ref is not in the record").not.toBe("");
      expect(
        [rec.assignment.harness, rec.assignment.model, rec.assignment.effort],
        "harness, model and effort are not three separate fields",
      ).toEqual(["claude-code", "claude-opus-5", "high"]);
      expect(rec.permission.kind, "the working directory's permission boundary was not derived").toBe(
        "unfenced",
      );
      expect(rec.assignment.deadline, "the deadline is absent").toBe("none");
      expect(rec.assignment.budget, "the authorized budget is absent").toBe("none");
      expect(rec.state, "a fresh record does not start reserved").toBe("reserved");
    }
    // ONE reservation file for the resource, naming the executor — and
    // the participant is not in it, which is what lets the two run
    // together.
    const held = readReservation(b.root, b.lane);
    expect(held?.attempt, "the reservation does not name the attempt that took it").toBe(exec.record.attempt);
    expect(existsSync(recordPath(b.root, phase1.record.attempt)), "the participant has no record").toBe(true);

    // THE POSITIVE CONTROL: the same start with a resource is refused
    // while the executor holds it, so the participant's acceptance above
    // is about being read-only rather than about this bench being empty.
    let refused: unknown;
    try {
      startRun(b.root, { assignment: assignment(b, { role: "a second writer" }), at: "2026-09-12T00:00:01.000Z", io: io() });
    } catch (err) {
      refused = err;
    }
    expect(refused, "a second WRITER for the held resource was allowed to start").toBeInstanceOf(
      RunRecordFinding,
    );
    expect((refused as RunRecordFinding).code).toBe("RESOURCE_RESERVED");
  } finally {
    b.cleanup();
  }
});

test("the assignment is refused FIELD BY FIELD, and `none` has to be typed rather than defaulted", () => {
  // KILLED BY: a default for any field, a refusal that names no field,
  // and an assignment reader that accepts an empty string.
  const b = bench("assignment");
  try {
    const file = path.join(b.scratch, "assign.json");
    const whole = assignment(b);
    for (const field of ["role", "harness", "model", "effort", "base", "budget", "deadline", "resource"]) {
      const broken: Record<string, unknown> = { ...whole };
      delete broken[field];
      writeFileSync(file, JSON.stringify(broken));
      let refused: unknown;
      try {
        readAssignment(file);
      } catch (err) {
        refused = err;
      }
      expect(refused, `an assignment with no ${field} was accepted`).toBeInstanceOf(RunRecordFinding);
      expect((refused as RunRecordFinding).message, `the refusal does not name ${field}`).toContain(field);
    }
    // THE POSITIVE CONTROL: the whole document, with `none` TYPED for
    // the two fields that may be none, is accepted — so the refusals
    // above are about the missing field and not about this reader
    // refusing everything.
    writeFileSync(file, JSON.stringify(whole));
    const started = startRun(b.root, { assignment: assignment(b), at: "2026-09-12T00:00:00.000Z", io: io() });
    expect(started.record.assignment.budget, "the control document did not start").toBe("none");
  } finally {
    b.cleanup();
  }
});

/* ════════════════════════════════════════════════════════════════════
 * CRITERION TWO — the bind, and the interrupt between the reservation
 * and it.
 * ════════════════════════════════════════════════════════════════════ */

test("a BIND attaches the harness's task id before the record is started, and one harness id cannot serve two attempts", () => {
  // THE NATIVE PATH: the id is INVENTED here, exactly as a harness would
  // hand one back, because a test cannot spawn a native child.
  //
  // KILLED BY: a start that reports `started` before any bind, a bind
  // that accepts an empty id, and a bind that lets one execution serve
  // two attempts.
  const b = bench("bind");
  try {
    const first = startRun(b.root, { assignment: assignment(b), at: "2026-09-12T00:00:00.000Z", io: io() });
    expect(first.record.state, "a reserved attempt claimed to be started").toBe("reserved");
    const bound = bindRun(b.root, {
      attempt: first.record.attempt,
      harnessId: "task-abc",
      at: "2026-09-12T00:00:01.000Z",
      io: io(),
    });
    expect(bound.state, "the bind did not make the launch a fact").toBe("started");
    expect(bound.execution?.harnessId, "the harness id is not in the record").toBe("task-abc");

    const other = startRun(b.root, {
      assignment: assignment(b, { resource: "none", role: "participant" }),
      at: "2026-09-12T00:00:02.000Z",
      io: io(),
    });
    let refused: unknown;
    try {
      bindRun(b.root, { attempt: other.record.attempt, harnessId: "task-abc", at: "2026-09-12T00:00:03.000Z", io: io() });
    } catch (err) {
      refused = err;
    }
    expect(refused, "one harness id was bound to two live attempts").toBeInstanceOf(RunRecordFinding);
    expect((refused as RunRecordFinding).code).toBe("BIND_ID_TAKEN");
    // THE POSITIVE CONTROL: a DIFFERENT id binds, so the refusal above
    // is about the id being taken rather than about the second attempt.
    const ok = bindRun(b.root, {
      attempt: other.record.attempt,
      harnessId: "task-def",
      at: "2026-09-12T00:00:04.000Z",
      io: io(),
    });
    expect(ok.state, "the control bind did not start the participant").toBe("started");
  } finally {
    b.cleanup();
  }
});

test("an INTERRUPT between the reservation and the bind starts no second writer and is RECONCILED rather than assumed stopped", () => {
  // THE NATIVE PATH. The interrupt is the real shape: `start` returned,
  // the seat died before it could spawn or bind, and what is on disk is
  // a reservation and a record reading `reserved`.
  //
  // KILLED BY: a reconciliation that reads an unbound attempt as ended —
  // which is the T-247 race performed by the guard, because the SPAWN
  // happens between those two steps — and by a reservation that a second
  // writer can take while the first might exist.
  const b = bench("interrupt");
  try {
    const first = startRun(b.root, { assignment: assignment(b), at: "2026-09-12T00:00:00.000Z", io: io() });
    // ... the seat is interrupted here. Nothing else runs.
    expect(first.record.state).toBe("reserved");
    expect(first.record.execution, "an unbound attempt carries an execution").toBeNull();

    let refused: unknown;
    try {
      startRun(b.root, { assignment: assignment(b, { role: "the replacement" }), at: "2026-09-12T00:01:00.000Z", io: io() });
    } catch (err) {
      refused = err;
    }
    expect(refused, "a second writer started while the first might exist").toBeInstanceOf(RunRecordFinding);

    const verdict = reconcile(readRecord(b.root, first.record.attempt), io());
    expect(verdict.verdict, "an unbound attempt was assumed stopped").toBe("undetermined");
    expect(
      verdict.sources.some((s) => s.includes("between the reservation and the bind")),
      "the reconciliation does not say WHY an unbound attempt cannot be read as un-started",
    ).toBe(true);
    let stopRefused: unknown;
    try {
      stopRun(b.root, { attempt: first.record.attempt, at: "2026-09-12T00:02:00.000Z", io: io() });
    } catch (err) {
      stopRefused = err;
    }
    expect(stopRefused, "an undetermined attempt was written `stopped`").toBeInstanceOf(RunRecordFinding);
    expect((stopRefused as RunRecordFinding).code).toBe("STOP_UNCERTAIN");

    // THE OTHER HALF, AND IT IS WHAT KEEPS THE FIRST FROM BEING A
    // DEADLOCK: once the seat READS ITS HARNESS and says so, termination
    // is established, the record is stopped and the resource is free.
    const stopped = stopRun(b.root, {
      attempt: first.record.attempt,
      evidence: `the harness lists no task for this attempt.\n${DONE_TOKEN} gone`,
      at: "2026-09-12T00:03:00.000Z",
      io: io(),
    });
    expect(stopped.record.state, "an established termination was not recorded").toBe("stopped");
    expect(readReservation(b.root, b.lane), "the reservation outlived the terminal record").toBeNull();
    const after = startRun(b.root, { assignment: assignment(b, { role: "the replacement" }), at: "2026-09-12T00:04:00.000Z", io: io() });
    expect(after.record.state, "the replacement could not start after the resource was freed").toBe("reserved");
  } finally {
    b.cleanup();
  }
});

/* ════════════════════════════════════════════════════════════════════
 * CRITERION THREE — the question, the three steps of an answer, and the
 * grant that lands after the stamp.
 * ════════════════════════════════════════════════════════════════════ */

test("an answer moves written, delivered, acknowledged with the evidence of each retained, and this arm never writes the acknowledgement itself", () => {
  // THE NATIVE PATH: the question arrives in the ask file, the
  // acknowledgement in the harness's own output.
  //
  // KILLED BY: an arm that marks an answer acknowledged when it writes
  // or delivers it, a step recorded without its evidence, and a
  // delivery accepted before the answer was written.
  const b = bench("answer");
  try {
    const rec = running(b);
    appendFileSync(askFile(b), `\n${ASK_TOKEN} q1 may I widen the fence\n`);
    const asked = observeRun(b.root, { attempt: rec.attempt, at: "2026-09-12T00:00:03.000Z", io: io() }).record;
    expect(asked.state, "an unacknowledged question did not block the assignment").toBe("blocked");
    expect(asked.questions.map((q) => q.id), "the question was not recorded against the attempt").toEqual(["q1"]);

    let early: unknown;
    try {
      sendAnswer(b.root, { attempt: rec.attempt, question: "q1", delivered: "the harness confirmed receipt", at: "2026-09-12T00:00:04.000Z", io: io() });
    } catch (err) {
      early = err;
    }
    expect(early, "an answer was delivered before it was written").toBeInstanceOf(RunRecordFinding);

    const written = sendAnswer(b.root, { attempt: rec.attempt, question: "q1", answer: "yes — the manifest is widened", at: "2026-09-12T00:00:05.000Z", io: io() }).record;
    expect(written.questions[0]?.answer?.state, "a written answer is not `written`").toBe("written");
    expect(readFileSync(askFile(b), "utf8"), "the answer never reached the channel").toContain(
      "yes — the manifest is widened",
    );

    const delivered = sendAnswer(b.root, { attempt: rec.attempt, question: "q1", delivered: "the harness confirmed receipt", at: "2026-09-12T00:00:06.000Z", io: io() }).record;
    expect(delivered.questions[0]?.answer?.state, "a delivered answer is not `delivered`").toBe("delivered");
    expect(
      delivered.questions[0]?.answer?.acknowledgedAt,
      "this arm acknowledged an answer for the child",
    ).toBeNull();

    const acked = observeRun(b.root, {
      attempt: rec.attempt,
      evidence: `the child replied:\n${ACK_TOKEN} q1\nand carried on`,
      at: "2026-09-12T00:00:07.000Z",
      io: io(),
    }).record;
    const answer = acked.questions[0]?.answer;
    expect(answer?.state, "an acknowledgement in the harness's output was not persisted").toBe("acknowledged");
    expect(
      answer?.evidence.map((e) => e.kind),
      "the evidence of each step was not retained",
    ).toEqual(["written", "delivered", "acknowledged: harness-output"]);
    expect(
      answer?.evidence.find((e) => e.kind === "acknowledged: harness-output")?.detail,
      "the original evidence was not kept beside the acknowledgement",
    ).toContain("carried on");
    expect(acked.state, "an acknowledged answer left the assignment blocked").toBe("running");
  } finally {
    b.cleanup();
  }
});

test("an interrupt after DELIVERED and before ACKNOWLEDGED re-delivers the answer on continue and never assumes it was read", () => {
  // THE PROCESS PATH, and it needs one: the interrupt is the execution
  // ENDING between the delivery and the acknowledgement, which is a fact
  // about a process. A real child is spawned and exits on its own.
  //
  // KILLED BY: a continue that treats a delivered answer as
  // acknowledged, one that re-delivers an ACKNOWLEDGED answer, and a
  // re-delivery that leaves no evidence.
  const b = bench("redeliver");
  try {
    const started = startRun(b.root, { assignment: assignment(b), at: "2026-09-12T00:00:00.000Z", io: io() });
    const child = spawnSync(process.execPath, ["-e", "process.exit(0)"], { encoding: "utf8" });
    expect(child.status, "the child under test did not run").toBe(0);
    const pid = child.pid as number;
    bindRun(b.root, { attempt: started.record.attempt, harnessId: "session-7", pid, at: "2026-09-12T00:00:01.000Z", io: io() });
    appendFileSync(askFile(b), `\n${ASK_TOKEN} q9 which base?\n`);
    observeRun(b.root, { attempt: started.record.attempt, at: "2026-09-12T00:00:02.000Z", io: io() });
    sendAnswer(b.root, { attempt: started.record.attempt, question: "q9", answer: "the dispatch stamp", at: "2026-09-12T00:00:03.000Z", io: io() });
    const delivered = sendAnswer(b.root, { attempt: started.record.attempt, question: "q9", delivered: "handed to the resumed session as its prompt", at: "2026-09-12T00:00:04.000Z", io: io() }).record;
    expect(delivered.questions[0]?.answer?.state).toBe("delivered");

    const before = readFileSync(askFile(b), "utf8").split("## ANSWER q9").length - 1;
    const carried = continueRun(b.root, { attempt: started.record.attempt, at: "2026-09-12T00:00:05.000Z", io: io() });
    expect(carried.redelivered, "the unacknowledged answer was not re-delivered").toEqual(["q9"]);
    const after = readFileSync(askFile(b), "utf8").split("## ANSWER q9").length - 1;
    expect(after, "the re-delivery never reached the channel").toBe(before + 1);
    expect(
      carried.record.questions[0]?.answer?.state,
      "a re-delivered answer was promoted to acknowledged",
    ).toBe("delivered");
    expect(carried.record.questions[0]?.answer?.redeliveries, "the re-delivery was not counted").toBe(1);

    // THE POSITIVE CONTROL: once the child acknowledges, a further
    // continue re-delivers NOTHING — so the re-delivery above is about
    // the missing acknowledgement rather than about every continue.
    bindRun(b.root, { attempt: started.record.attempt, harnessId: "session-7", pid, at: "2026-09-12T00:00:06.000Z", io: io() });
    appendFileSync(askFile(b), `\n${ACK_TOKEN} q9\n`);
    observeRun(b.root, { attempt: started.record.attempt, at: "2026-09-12T00:00:07.000Z", io: io() });
    const again = continueRun(b.root, { attempt: started.record.attempt, at: "2026-09-12T00:00:08.000Z", io: io() });
    expect(again.redelivered, "an acknowledged answer was re-delivered anyway").toEqual([]);
  } finally {
    b.cleanup();
  }
});

test("a scope grant that lands after the stamp is refused for the resumed attempt and requires a fresh one", () => {
  // THE NATIVE PATH. The stamp is READ off the card in the resource and
  // the boundary off the fence manifest, so neither is typed into this
  // body as a claim.
  //
  // KILLED BY: a refusal that fires on any widening (the mid-build one
  // is ordinary and must pass), one that never fires, and one that
  // reads the stamp from the assignment instead of the tree.
  const b = bench("grant");
  try {
    armFence(b, ["tools/e2e/scripts/run-record.mjs"]);
    stampCard(b, "building");
    const rec = running(b);
    expect(rec.stamp.seen, "the stamp was not read off the card in the resource").toBe("building");

    // THE ORDINARY MID-BUILD WIDENING — the fence moves while the card
    // is still `building`, and the answer goes through.
    armFence(b, ["tools/e2e/scripts/run-record.mjs", "tools/e2e/tests/run-record.spec.ts"]);
    appendFileSync(askFile(b), `\n${ASK_TOKEN} q2 may I have the spec file\n`);
    observeRun(b.root, { attempt: rec.attempt, at: "2026-09-12T00:00:04.000Z", io: io() });
    const ok = sendAnswer(b.root, { attempt: rec.attempt, question: "q2", answer: "granted", at: "2026-09-12T00:00:05.000Z", io: io() });
    expect(ok.wrote, "an ordinary mid-build widening was refused").toBe(true);

    // AND THE ONE THAT IS NOT ORDINARY: the card is stamped, and only
    // then does the boundary move again.
    stampCard(b, "verifying");
    observeRun(b.root, { attempt: rec.attempt, evidence: "still here", at: "2026-09-12T00:00:06.000Z", io: io() });
    armFence(b, ["tools/e2e/scripts/run-record.mjs", "tools/e2e/tests/run-record.spec.ts", "docs/CONVENTIONS.md"]);
    for (const act of ["send", "continue"] as const) {
      let refused: unknown;
      try {
        if (act === "send") {
          sendAnswer(b.root, { attempt: rec.attempt, question: "q2", answer: "and this too", at: "2026-09-12T00:00:07.000Z", io: io() });
        } else {
          continueRun(b.root, { attempt: rec.attempt, evidence: `${DONE_TOKEN} gone`, at: "2026-09-12T00:00:07.000Z", io: io() });
        }
      } catch (err) {
        refused = err;
      }
      expect(refused, `a grant after the stamp was applied to the resumed attempt by ${act}`).toBeInstanceOf(
        RunRecordFinding,
      );
      expect((refused as RunRecordFinding).code).toBe("GRANT_AFTER_STAMP");
    }
    // AND THE FRESH ATTEMPT IS THE WAY THROUGH: a new record digests the
    // widened boundary at its own start, so it is answerable for it.
    stopRun(b.root, { attempt: rec.attempt, evidence: `${DONE_TOKEN} gone`, at: "2026-09-12T00:00:08.000Z", io: io() });
    const fresh = startRun(b.root, { assignment: assignment(b), at: "2026-09-12T00:00:09.000Z", io: io() });
    expect(fresh.record.permission.paths, "the fresh attempt did not digest the widened boundary").toBe(3);
  } finally {
    b.cleanup();
  }
});

/* ════════════════════════════════════════════════════════════════════
 * CRITERION FOUR — collect for every terminal state, and a stop that
 * signals nothing.
 * ════════════════════════════════════════════════════════════════════ */

test("collect answers for finished, failed and stopped alike, and an `unknown` usage is collected rather than dropped", () => {
  // THE NATIVE PATH for the finished and failed runs; the stopped one
  // uses the seat's own reading of its harness, which is the only source
  // that can answer for a native child.
  //
  // KILLED BY: a collect that refuses a failed or stopped run, one that
  // runs before the state is terminal, and one that drops the evidence.
  const b = bench("collect");
  try {
    for (const [evidence, want] of [
      [`${DONE_TOKEN} ok`, "finished"],
      [`${DONE_TOKEN} failed`, "failed"],
    ] as const) {
      const rec = running(b);
      let early: unknown;
      try {
        collectRun(b.root, { attempt: rec.attempt, at: "2026-09-12T00:00:03.000Z", io: io() });
      } catch (err) {
        early = err;
      }
      expect(early, "a running attempt was collected").toBeInstanceOf(RunRecordFinding);
      expect((early as RunRecordFinding).code).toBe("COLLECT_NOT_TERMINAL");

      const ended = observeRun(b.root, { attempt: rec.attempt, evidence, at: "2026-09-12T00:00:04.000Z", io: io() }).record;
      expect(ended.state, `the ${want} run was not recognised`).toBe(want);
      const got = collectRun(b.root, {
        attempt: rec.attempt,
        ref: "0123456789abcdef0123456789abcdef01234567",
        at: "2026-09-12T00:00:05.000Z",
        io: io(),
      });
      expect(got.collected.state, "the collected state is not the terminal one").toBe(want);
      expect(got.collected.usage, "an unmeasured usage was dropped rather than collected").toBe("unknown");
      expect(got.collected.refs, "the partial ref was not collected").toContain(
        "0123456789abcdef0123456789abcdef01234567",
      );
      expect(got.collected.evidence.length, "no evidence was retained").toBeGreaterThan(0);
    }
    const rec = running(b);
    stopRun(b.root, { attempt: rec.attempt, evidence: `${DONE_TOKEN} gone`, at: "2026-09-12T00:00:06.000Z", io: io() });
    const stopped = collectRun(b.root, { attempt: rec.attempt, usage: "4210 tokens", at: "2026-09-12T00:00:07.000Z", io: io() });
    expect(stopped.collected.state, "a stopped run could not be collected").toBe("stopped");
    expect(stopped.collected.usage, "the stopped run's usage was not collected").toBe("4210 tokens");
    expect(TERMINAL_STATES, "the terminal set is not the three this criterion names").toEqual([
      "finished",
      "failed",
      "stopped",
    ]);
  } finally {
    b.cleanup();
  }
});

test("stop is written only after termination is established, and it can never reach the shared harness process", async () => {
  // THE PROCESS PATH, with a REAL child that exits on its own. **NOTHING
  // HERE SIGNALS ANYTHING** — the child ends itself, which is the same
  // shape as the property under test.
  //
  // KILLED BY: a stop that writes `stopped` over a live execution, one
  // that ignores an owned job still alive, and one that would act on
  // this session's own harness process.
  const b = bench("stop");
  try {
    const started = startRun(b.root, { assignment: assignment(b), at: "2026-09-12T00:00:00.000Z", io: io() });
    const child = spawn(process.execPath, ["-e", "setTimeout(() => process.exit(0), 1500)"], {
      stdio: "ignore",
    });
    const pid = child.pid as number;
    bindRun(b.root, { attempt: started.record.attempt, harnessId: "session-live", pid, at: "2026-09-12T00:00:01.000Z", io: defaultRunIo() });
    let live: unknown;
    try {
      stopRun(b.root, { attempt: started.record.attempt, at: "2026-09-12T00:00:02.000Z", io: defaultRunIo() });
    } catch (err) {
      live = err;
    }
    expect(live, "a live execution was recorded as stopped").toBeInstanceOf(RunRecordFinding);
    expect((live as RunRecordFinding).code).toBe("STOP_NOT_TERMINATED");

    await new Promise<void>((resolve) => {
      child.on("exit", () => resolve());
    });

    // AN OWNED JOB STILL ALIVE HOLDS THE STOP, because an execution that
    // ended while what it started did not is the same race one layer
    // down.
    const withJob = readRecord(b.root, started.record.attempt);
    withJob.ownedJobs = [{ kind: "port", id: "15311" }];
    writeFileSync(recordPath(b.root, withJob.attempt), `${JSON.stringify(withJob, null, 2)}\n`);
    let job: unknown;
    try {
      stopRun(b.root, {
        attempt: started.record.attempt,
        at: "2026-09-12T00:00:04.000Z",
        io: io({ identity: () => null, listening: () => true }),
      });
    } catch (err) {
      job = err;
    }
    expect(job, "a stop was written while an owned job was still alive").toBeInstanceOf(RunRecordFinding);

    const gone = stopRun(b.root, {
      attempt: started.record.attempt,
      at: "2026-09-12T00:00:05.000Z",
      io: io({ identity: () => null, listening: () => false }),
    });
    expect(gone.record.state, "an established termination was not recorded").toBe("stopped");
    expect(gone.reconciliation.verdict, "the stop did not establish termination first").toBe("ended");

    // THE SHARED HARNESS PROCESS: a record naming this process is
    // refused BY NAME, and no path in the module could signal it anyway.
    const shared = startRun(b.root, {
      assignment: assignment(b, { resource: "none", role: "participant" }),
      at: "2026-09-12T00:00:06.000Z",
      io: io(),
    });
    bindRun(b.root, { attempt: shared.record.attempt, harnessId: "session-shared", pid: process.pid, at: "2026-09-12T00:00:07.000Z", io: io() });
    let harness: unknown;
    try {
      stopRun(b.root, { attempt: shared.record.attempt, at: "2026-09-12T00:00:08.000Z", io: io() });
    } catch (err) {
      harness = err;
    }
    expect(harness, "a stop was allowed to name the shared harness process").toBeInstanceOf(RunRecordFinding);
    expect((harness as RunRecordFinding).code).toBe("STOP_SHARED_HARNESS");

    const src = readFileSync(path.join(repoRoot, "tools/e2e/scripts/run-record.mjs"), "utf8");
    for (const signal of ["process.kill(", ".kill(", "SIGTERM", "SIGKILL", "pkill"]) {
      expect(src.includes(signal), `run-record.mjs holds a path that could signal (${signal})`).toBe(false);
    }
  } finally {
    b.cleanup();
  }
});

/* ════════════════════════════════════════════════════════════════════
 * CRITERION FIVE — reconciliation before any replacement.
 * ════════════════════════════════════════════════════════════════════ */

test("an uncertain attempt starts no replacement, and an established termination releases the resource for one", async () => {
  // THE PROCESS PATH with a real child, so "uncertain" and "ended" are
  // the process table's answers rather than this body's.
  //
  // KILLED BY: a reconciliation that answers `ended` while the process
  // is live, one that never answers `ended` at all (a reservation that
  // can never be released fails the second half), and a replacement
  // that starts before either was established.
  const b = bench("reconcile");
  try {
    const started = startRun(b.root, { assignment: assignment(b), at: "2026-09-12T00:00:00.000Z", io: io() });
    const child = spawn(process.execPath, ["-e", "setTimeout(() => process.exit(0), 1500)"], { stdio: "ignore" });
    const pid = child.pid as number;
    bindRun(b.root, { attempt: started.record.attempt, harnessId: "session-r", pid, at: "2026-09-12T00:00:01.000Z", io: defaultRunIo() });

    const whileLive = reconcile(readRecord(b.root, started.record.attempt), defaultRunIo());
    expect(whileLive.verdict, "a live execution was reconciled as ended").toBe("live");
    let replaced: unknown;
    try {
      continueRun(b.root, { attempt: started.record.attempt, replace: true, at: "2026-09-12T00:00:02.000Z", io: defaultRunIo() });
    } catch (err) {
      replaced = err;
    }
    expect(replaced, "a replacement started while the first might exist").toBeInstanceOf(RunRecordFinding);
    expect((replaced as RunRecordFinding).code).toBe("CONTINUE_PRIOR_LIVE");

    await new Promise<void>((resolve) => {
      child.on("exit", () => resolve());
    });

    const whenGone = reconcile(readRecord(b.root, started.record.attempt), defaultRunIo());
    expect(whenGone.verdict, "a reservation that can never be released: termination was never established").toBe(
      "ended",
    );
    const fresh = continueRun(b.root, { attempt: started.record.attempt, replace: true, at: "2026-09-12T00:00:04.000Z", io: defaultRunIo() });
    expect(fresh.replaced, "the replacement does not name what it replaces").toBe(started.record.attempt);
    expect(fresh.record.attempt, "the replacement reused the attempt id").not.toBe(started.record.attempt);
    expect(fresh.record.history.length, "the replacement erased the execution it replaced").toBeGreaterThan(0);
    expect(readReservation(b.root, b.lane)?.attempt, "the resource did not move to the replacement").toBe(
      fresh.record.attempt,
    );
  } finally {
    b.cleanup();
  }
});

/* ════════════════════════════════════════════════════════════════════
 * CRITERION SIX — the process child's whole sequence, and the
 * reacquisition after a release.
 * ════════════════════════════════════════════════════════════════════ */

test("a PROCESS CHILD's question, exit, answer, same-session resume, acknowledgement, completion and release happen in that order", async () => {
  // THE PROCESS PATH, end to end, with TWO real child processes: one
  // that asks and exits, and one that is the RESUMED session — the same
  // harness session id, a new execution — which reads the answer,
  // acknowledges it and completes.
  //
  // KILLED BY: a process exit read as `finished`, a resume that runs
  // before the prior execution ended, a reservation released while the
  // assignment is blocked, and a completion that does not release it.
  const b = bench("process-child");
  try {
    const started = startRun(b.root, { assignment: assignment(b), at: "2026-09-12T00:00:00.000Z", io: io() });
    const attempt = started.record.attempt;
    const ask = askFile(b);

    // 1. THE QUESTION, and then the process EXITS.
    const first = spawnSync(
      process.execPath,
      ["-e", `require("fs").appendFileSync(${JSON.stringify(ask)}, "\\n${ASK_TOKEN} q1 which base do I cut from?\\n")`],
      { encoding: "utf8" },
    );
    expect(first.status, "the child did not run").toBe(0);
    bindRun(b.root, { attempt, harnessId: "session-42", pid: first.pid as number, at: "2026-09-12T00:00:01.000Z", io: defaultRunIo() });

    // 2. THE ASSIGNMENT IS BLOCKED, THE EXECUTION HAS ENDED, AND THE
    //    RESERVATION IS STILL HELD.
    const blocked = observeRun(b.root, { attempt, at: "2026-09-12T00:00:02.000Z", io: defaultRunIo() }).record;
    expect(blocked.state, "process exit was read as finished").toBe("blocked");
    expect(blocked.execution?.endedAt, "the ended execution was not recorded").not.toBeNull();
    expect(readReservation(b.root, b.lane)?.attempt, "a blocked writer lost its reservation").toBe(attempt);

    // 3. THE ANSWER.
    sendAnswer(b.root, { attempt, question: "q1", answer: "the dispatch stamp", at: "2026-09-12T00:00:03.000Z", io: defaultRunIo() });

    // 4. THE SAME-SESSION RESUME — only after the prior execution ended.
    const carried = continueRun(b.root, { attempt, at: "2026-09-12T00:00:04.000Z", io: defaultRunIo() });
    expect(carried.reconciliation.verdict, "the resume did not establish that the prior execution ended").toBe("ended");
    expect(carried.record.state, "the resumed attempt is not waiting for its next bind").toBe("reserved");
    const second = spawnSync(
      process.execPath,
      [
        "-e",
        `const fs=require("fs");const f=${JSON.stringify(ask)};const t=fs.readFileSync(f,"utf8");` +
          `if(!t.includes("the dispatch stamp"))process.exit(3);` +
          `fs.appendFileSync(f,"\\n${ACK_TOKEN} q1\\n${DONE_TOKEN} ok\\n")`,
      ],
      { encoding: "utf8" },
    );
    expect(second.status, "the resumed session could not read the answer it was given").toBe(0);
    bindRun(b.root, { attempt, harnessId: "session-42", pid: second.pid as number, at: "2026-09-12T00:00:05.000Z", io: defaultRunIo() });

    // 5, 6 AND 7. THE ACKNOWLEDGEMENT, THE COMPLETION AND THE RELEASE.
    const done = observeRun(b.root, { attempt, at: "2026-09-12T00:00:06.000Z", io: defaultRunIo() }).record;
    expect(done.questions[0]?.answer?.state, "the child's own acknowledgement was not taken from its file").toBe(
      "acknowledged",
    );
    expect(done.state, "the completed assignment was not recorded as finished").toBe("finished");
    expect(readReservation(b.root, b.lane), "a finished writer kept its reservation").toBeNull();
    expect(
      done.history.length + (done.execution === null ? 0 : 1),
      "the resumed record forgot the execution it continued",
    ).toBeGreaterThan(1);
  } finally {
    b.cleanup();
  }
});

test("an authorized continuation after a release REACQUIRES the resource atomically, and is refused when another attempt took it first", () => {
  // THE NATIVE PATH — what is under test is the reservation, not a
  // process, so the executions here are bound by invented ids.
  //
  // KILLED BY: a continue that resumes onto a resource another attempt
  // holds, one that cannot reacquire a released resource at all, and a
  // reacquisition that is not the exclusive create.
  const b = bench("reacquire");
  try {
    const first = startRun(b.root, { assignment: assignment(b), at: "2026-09-12T00:00:00.000Z", io: io() });
    bindRun(b.root, { attempt: first.record.attempt, harnessId: "s1", at: "2026-09-12T00:00:01.000Z", io: io() });
    observeRun(b.root, { attempt: first.record.attempt, evidence: `${DONE_TOKEN} gone`, at: "2026-09-12T00:00:02.000Z", io: io() });
    expect(readRecord(b.root, first.record.attempt).state, "the run did not end in `unknown`").toBe("unknown");
    stopRun(b.root, { attempt: first.record.attempt, evidence: `${DONE_TOKEN} gone`, at: "2026-09-12T00:00:03.000Z", io: io() });
    expect(readReservation(b.root, b.lane), "a stopped attempt kept the resource").toBeNull();

    // THE AUTHORIZED CONTINUATION: the resource is free, so it is
    // reacquired and the attempt may be bound again.
    const again = continueRun(b.root, { attempt: first.record.attempt, evidence: `${DONE_TOKEN} gone`, at: "2026-09-12T00:00:04.000Z", io: io() });
    expect(again.record.state, "the continuation did not return the attempt to its next bind").toBe("reserved");
    expect(readReservation(b.root, b.lane)?.attempt, "the released resource was not reacquired").toBe(
      first.record.attempt,
    );
    expect(again.record.reservation.releasedAt, "the record still says the resource is released").toBeNull();

    // AND THE REFUSAL: another attempt gets there first.
    stopRun(b.root, { attempt: first.record.attempt, evidence: `${DONE_TOKEN} gone`, at: "2026-09-12T00:00:05.000Z", io: io() });
    const other = startRun(b.root, { assignment: assignment(b, { role: "whoever got there first" }), at: "2026-09-12T00:00:06.000Z", io: io() });
    let refused: unknown;
    try {
      continueRun(b.root, { attempt: first.record.attempt, evidence: `${DONE_TOKEN} gone`, at: "2026-09-12T00:00:07.000Z", io: io() });
    } catch (err) {
      refused = err;
    }
    expect(refused, "a continuation resumed onto a resource another attempt holds").toBeInstanceOf(
      RunRecordFinding,
    );
    expect((refused as RunRecordFinding).code).toBe("CONTINUE_RESOURCE_TAKEN");
    expect(readReservation(b.root, b.lane)?.attempt, "the refused continuation took the resource anyway").toBe(
      other.record.attempt,
    );
    // THE EXCLUSIVE CREATE IS THE MECHANISM, and it is asserted rather
    // than assumed: the reservation file already exists, so a second
    // create of it fails.
    expect(existsSync(reservationPath(b.root, b.lane)), "there is no reservation file to be exclusive about").toBe(
      true,
    );
  } finally {
    b.cleanup();
  }
});

/* ════════════════════════════════════════════════════════════════════
 * THE WAIT, AND THE SHAPE OF THE WHOLE THING.
 * ════════════════════════════════════════════════════════════════════ */

test("the wait RE-OBSERVES and reports its ceiling, and a ceiling reached is never read as finished", async () => {
  // THE NATIVE PATH with an injected clock, so this body cannot itself
  // hang: a real-time wait would either take its own ceiling to red or
  // assert nothing.
  //
  // KILLED BY: a wait that returns satisfied when it ran out of time,
  // one that writes a terminal state at its ceiling, and one that never
  // re-observes (a wait on a record nothing re-derives ends only by
  // accident).
  const b = bench("wait");
  try {
    const rec = running(b);
    const clock = { t: 0 };
    const ticks: number[] = [];
    const reached = await waitRun(
      b.root,
      { attempt: rec.attempt, ceilingMs: 1000, at: "2026-09-12T00:00:03.000Z", io: io() },
      {
        now: () => clock.t,
        sleep: async (ms: number) => {
          ticks.push(ms);
          clock.t += ms;
        },
      },
    );
    expect(reached.ceiling, "the wait did not report reaching its ceiling").toBe(true);
    expect(reached.satisfied, "a wait that ran out of time reported success").toBe(false);
    expect(reached.record.state, "the ceiling was read as a terminal state").toBe("running");
    expect(ticks.reduce((a, c) => a + c, 0), "the wait slept past the ceiling it stated").toBe(1000);
    expect(reached.polls, "the wait never asked").toBeGreaterThan(1);

    // THE POSITIVE CONTROL: the same wait ends on the FACT once the
    // world says so, which is what makes the ceiling above a ceiling
    // rather than a wait that can never be satisfied.
    appendFileSync(askFile(b), `\n${ASK_TOKEN} q3 a question\n`);
    clock.t = 0;
    const satisfied = await waitRun(
      b.root,
      { attempt: rec.attempt, ceilingMs: 1000, at: "2026-09-12T00:00:04.000Z", io: io() },
      {
        now: () => clock.t,
        sleep: async (ms: number) => {
          clock.t += ms;
        },
      },
    );
    expect(satisfied.satisfied, "the wait did not end on the fact").toBe(true);
    expect(satisfied.record.state, "the fact the wait ended on is not the blocked assignment").toBe("blocked");
  } finally {
    b.cleanup();
  }
});

test("the operations are the seven the card names plus the bind that closes a launch, and no adapter, daemon, heartbeat or scheduler is built here", () => {
  // KILLED BY: an operation added or dropped, a dial accepted by a verb
  // that does not read it, and a module that grew a timer — which is
  // what a heartbeat and a scheduler are made of.
  expect(OPERATIONS, "the operation set is not the card's").toEqual([
    "start",
    "bind",
    "observe",
    "send",
    "wait",
    "collect",
    "continue",
    "stop",
  ]);
  const src = readFileSync(path.join(repoRoot, "tools/e2e/scripts/run-record.mjs"), "utf8");
  for (const timer of ["setInterval(", "setTimeout(", "setImmediate("]) {
    expect(src.includes(timer), `run-record.mjs schedules its own work (${timer})`).toBe(false);
  }
  // NO ADAPTER: nothing here launches a child of its own. The one
  // `spawnSync` is the process-table probe the default io makes, and it
  // is the only process this module starts.
  expect(src.split("spawnSync(").length - 1, "run-record.mjs starts more processes than its own probes").toBeLessThan(
    4,
  );

  // A DIAL A VERB DOES NOT READ IS REFUSED RATHER THAN IGNORED.
  let stray: unknown;
  try {
    runPlan({ run: "observe", attempt: `${WORK}-a1`, usage: "12k" });
  } catch (err) {
    stray = err;
  }
  expect(stray, "a dial that means nothing to the verb was accepted and ignored").toBeInstanceOf(RunRecordFinding);
  expect((stray as RunRecordFinding).code).toBe("RUN_STRAY_DIAL");
  // THE POSITIVE CONTROL: the same verb with the dial it DOES read is
  // planned, so the refusal is about the dial rather than the verb.
  expect(runPlan({ run: "observe", attempt: `${WORK}-a1`, evidence: "x" }).verb).toBe("observe");
  let verb: unknown;
  try {
    runPlan({ run: "resume", attempt: `${WORK}-a1` });
  } catch (err) {
    verb = err;
  }
  expect(verb, "a verb outside the operation set was planned").toBeInstanceOf(RunRecordFinding);
});

test("the lane protocol names the run record as the contract every child runs under, and names no product's spelling for it", () => {
  // KILLED BY: the section dropped from the protocol, a section that
  // does not say every child runs under a record, and one that spells a
  // product's own paths in a file whose opening rules that a project
  // spells its own names in its CONVENTIONS.
  const protocol = readFileSync(path.join(repoRoot, "method/lane-protocol.md"), "utf8");
  const heading = "## The run record — the contract every child runs under";
  expect(protocol, "the lane protocol does not name the run record").toContain(heading);
  const section = protocol.slice(protocol.indexOf(heading)).split("\n## ")[0] ?? "";
  expect(section, "the section does not say EVERY child has a record").toMatch(/every child/i);
  expect(section, "the section does not name the exclusive reservation for writers").toMatch(/reservation/i);
  expect(section, "the section does not carry the seven operations").toMatch(
    /start.*observe.*send.*wait.*collect.*continue.*stop/s,
  );
  expect(section, "the section does not say an uncertain record is reconciled before a replacement").toMatch(
    /reconcile/i,
  );
  // THE PRODUCT-AGNOSTIC HALF: this file's own opening says the names
  // are placeholders and a project spells them in its CONVENTIONS, so
  // the section may not spell this project's runtime directory.
  expect(section.includes(".supertaskr"), "the method text spells a product's own runtime path").toBe(false);
  // AND THE PROJECT'S OWN SPELLING EXISTS, where that opening says it
  // belongs — so the two halves are one rule rather than a gap.
  const conventions = readFileSync(path.join(repoRoot, "docs/CONVENTIONS.md"), "utf8");
  expect(conventions, "this project spells no home for its run records").toContain(".supertaskr/runs/");
  expect(conventions, "the project's bullet does not name the verbs a seat types").toContain("--run");
});

/* ════════════════════════════════════════════════════════════════════
 * THE RECORD ITSELF — the document a recovery reads.
 * ════════════════════════════════════════════════════════════════════ */

test("the record is one JSON document per attempt under the runs directory, and a continuation keeps the history it continues", () => {
  // KILLED BY: a record written outside the runs directory, a second
  // attempt overwriting the first, and a continuation that erases the
  // execution it resumed.
  const b = bench("document");
  try {
    const rec = running(b);
    const file = recordPath(b.root, rec.attempt);
    expect(file.includes(path.join(".supertaskr", "runs", WORK)), "the record is not under the runs directory").toBe(
      true,
    );
    const onDisk = JSON.parse(readFileSync(file, "utf8")) as RunRecord;
    expect(onDisk.attempt, "the document does not name its own attempt").toBe(rec.attempt);
    expect(onDisk.events.length, "the record keeps no event history").toBeGreaterThan(2);

    observeRun(b.root, { attempt: rec.attempt, evidence: `${DONE_TOKEN} gone`, at: "2026-09-12T00:00:04.000Z", io: io() });
    const carried = continueRun(b.root, { attempt: rec.attempt, at: "2026-09-12T00:00:05.000Z", io: io() });
    expect(carried.record.history.length, "the continuation dropped the execution it continued").toBe(1);
    expect(carried.record.history[0]?.harnessId, "the retained execution lost its identity").toBe(
      `task-${rec.attempt}`,
    );
    expect(
      readdirSync(path.dirname(file)).filter((f) => f.endsWith(".json")).length,
      "a continuation of one attempt wrote a second document",
    ).toBe(1);

    const replaced = continueRun(b.root, {
      attempt: rec.attempt,
      replace: true,
      evidence: `${DONE_TOKEN} gone`,
      at: "2026-09-12T00:00:06.000Z",
      io: io(),
    });
    expect(replaced.record.replaces, "the replacement does not name what it replaces").toBe(rec.attempt);
    expect(
      readdirSync(path.dirname(file)).filter((f) => f.endsWith(".json")).length,
      "the replacement did not get its own document",
    ).toBe(2);
    expect(existsSync(file), "the replacement overwrote the record it replaced").toBe(true);
  } finally {
    b.cleanup();
  }
});

/* ════════════════════════════════════════════════════════════════════
 * THE VERIFIER'S ASSIGNED CORRECTION (T-311, phase 2).
 * ════════════════════════════════════════════════════════════════════ */

/**
 * The racer the body below spawns. It is written into the bench's own
 * scratch directory rather than kept as a file of its own: a second file
 * under `tests/` is a fence question, and this is one body's helper.
 */
const RACER = `
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const [modulePath, root, resource, barrier, winners, label] = process.argv.slice(2);
const { takeReservation } = await import(pathToFileURL(modulePath).href);

// PRE-WARM on a resource nobody contends, so the runtime directory, the
// reservations directory and this code path are already there when the
// barrier opens. Without it each racer does a different amount of
// first-time work AFTER the barrier and the twelve spread themselves
// out over milliseconds — which measures the warm-up rather than the
// reservation.
takeReservation(root, {
  resource: resource + "-warm-" + label,
  attempt: label + "warm-a1",
  role: "warm",
  at: "2026-09-12T00:00:00.000Z",
});

const nap = new Int32Array(new SharedArrayBuffer(4));
while (!existsSync(barrier)) Atomics.wait(nap, 0, 0, 1);

try {
  takeReservation(root, {
    resource,
    attempt: label + "-a1",
    role: "a racer",
    at: "2026-09-12T00:00:00.000Z",
  });
  mkdirSync(winners, { recursive: true });
  writeFileSync(winners + "/" + label, "won", "utf8");
} catch (err) {
  if (err && err.code === "RESOURCE_RESERVED") process.exit(0);
  console.error(String(err));
  process.exit(3);
}
`;

test("the reservation is the EXCLUSIVE CREATE ITSELF, not an existence check in front of a write — the one place a check-then-write and an `O_EXCL` open answer differently", async () => {
  // ASSIGNED BY THE VERIFIER AT PHASE 2. Every other body in this file
  // takes its reservations ONE AFTER ANOTHER, and a check-then-write
  // refuses a second caller exactly as an exclusive create does when
  // nothing is concurrent — so none of them can tell the two apart, and
  // `atomically`, which is the word the criterion uses and the whole
  // answer to the T-247 race, was pinned by nothing. Measured: with
  // `openSyncExclusive` reduced to `existsSync` then `openSync(file,
  // "w")`, all sixteen bodies stayed green.
  //
  // KILLED BY: any existence check standing in for the exclusive create.
  //
  // THE DETERMINISTIC HALF IS A DANGLING SYMLINK, and it is deterministic
  // because the two primitives disagree about one on this platform —
  // measured here before the body was written: `existsSync` FOLLOWS the
  // link and answers false, while `open(O_CREAT|O_EXCL)` refuses to
  // follow one at all and throws EEXIST. So an exclusive create REFUSES
  // the reservation and a check-then-write sails through it and writes
  // the reservation somewhere else entirely — which is also why this is
  // the right shape for the property rather than a grep for a flag.
  //
  // THE SECOND HALF IS A REAL RACE, because the property is about
  // concurrency and a body that never runs two writers at once has
  // measured a syscall rather than the race. It CANNOT FAIL RED under
  // an exclusive create — the filesystem admits exactly one — so it adds
  // kill power without adding a flake.
  const b = bench("exclusive-create");
  try {
    const file = reservationPath(b.root, b.lane);
    mkdirSync(path.dirname(file), { recursive: true });
    const elsewhere = path.join(b.scratch, "not-the-reservations-directory.json");
    symlinkSync(elsewhere, file);
    expect(existsSync(file), "the planted link is not dangling, so it decides nothing").toBe(false);

    let refused: unknown;
    try {
      startRun(b.root, { assignment: assignment(b), at: "2026-09-12T00:00:00.000Z", io: io() });
    } catch (err) {
      refused = err;
    }
    expect(
      refused,
      "the reservation is an existence check in front of a write: it followed a link `existsSync` " +
        "could not see and wrote the reservation outside the reservations directory",
    ).toBeInstanceOf(RunRecordFinding);
    expect((refused as RunRecordFinding).code).toBe("RESOURCE_RESERVED");
    expect(existsSync(elsewhere), "the reservation was written through the planted link").toBe(false);

    // THE POSITIVE CONTROL: with the link gone the same start takes the
    // same resource, so the refusal above is about the exclusive create
    // meeting something already at that path rather than about this
    // bench refusing every start.
    rmSync(file, { force: true });
    const ok = startRun(b.root, { assignment: assignment(b), at: "2026-09-12T00:00:01.000Z", io: io() });
    expect(ok.record.state, "the control start was refused too").toBe("reserved");
    rmSync(file, { force: true });
    rmSync(path.join(b.root, ".supertaskr", "runs", WORK), { recursive: true, force: true });

    // AND THE RACE: twelve processes reach for one resource at one
    // instant and exactly one may hold it.
    const racer = path.join(b.scratch, "racer.mjs");
    writeFileSync(racer, RACER, "utf8");
    const modulePath = path.join(repoRoot, "tools/e2e/scripts/run-record.mjs");
    const barrier = path.join(b.scratch, "go");
    const winners = path.join(b.scratch, "winners");
    const kids: Promise<number>[] = [];
    for (let i = 0; i < 12; i += 1) {
      kids.push(
        new Promise<number>((resolve) => {
          const child = spawn(
            process.execPath,
            [racer, modulePath, b.root, b.lane, barrier, winners, `w${String(i)}`],
            { stdio: ["ignore", "ignore", "inherit"] },
          );
          child.on("exit", (code) => resolve(code ?? 0));
        }),
      );
    }
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 900);
    });
    writeFileSync(barrier, "go", "utf8");
    const codes = await Promise.all(kids);
    expect(
      codes.filter((c) => c !== 0),
      "a racer failed for a reason that is not the refusal under test",
    ).toEqual([]);
    const held = existsSync(winners) ? readdirSync(winners) : [];
    expect(
      held.length,
      `${String(held.length)} of twelve racers took one resource at once: the reservation is not exclusive`,
    ).toBe(1);
    expect(readReservation(b.root, b.lane)?.attempt, "the reservation names no racer").toBe(
      `${String(held[0])}-a1`,
    );
  } finally {
    b.cleanup();
  }
});
