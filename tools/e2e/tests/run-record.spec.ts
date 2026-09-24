import { spawnSync, spawn } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { repoRoot } from "../preflight";
import {
  GRANT_JOURNAL_REL_PATH,
  GRANT_STORE_REL_PATH,
  GRANT_SUPERSEDED_REL_PATH,
  composeGrantSnapshot,
  dispatchBlock,
  dueRetries,
  expressInstants,
  expressMeasurements,
  parseProcessSchema,
} from "../scripts/dispatch-brief.mjs";
import { NO_BACKGROUND_MAINTENANCE, removeGitFixture } from "./git-fixture";
import {
  ACK_TOKEN,
  ASK_TOKEN,
  DONE_TOKEN,
  OBSERVED_KEYS,
  OBSERVED_TOKEN,
  OBSERVED_UNKNOWN,
  launchReceipt,
  parseInstantDial,
  readInstants,
  OPERATIONS,
  RunRecordFinding,
  TERMINAL_STATES,
  allRecords,
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
  runRecs,
  sendAnswer,
  startRun,
  stopRun,
  waitRun,
} from "../scripts/run-record.mjs";
import type { Assignment, RunIo, RunRecord } from "../scripts/run-record.mjs";
import { conventionsText } from "../scripts/docs-scan.mjs";

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
  const conventions = conventionsText(repoRoot);
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

test("an attempt id and a work id are a CHARSET, never a path fragment — an id that would leave the runs directory is REFUSED", () => {
  // THE VERIFIER'S CORRECTION 2 (T-311, phase 2 at a98e5a06): `workOf` accepted everything before the
  // `-a<n>` suffix, a path included — recordPath("/tmp/ROOT", "../../../etc/evil-a1") answered
  // "/etc/evil-a1.json" — and readAssignment took any non-empty string as a work id. Both ids are a
  // charset now, in the two places the module already refuses things. RED at the lane's tip as written
  // (1 failed / 17 passed), GREEN with the charset (18 bodies); handed over by the verdict as the
  // acceptance test the fix must turn green, applied by the integrator at the merge.
  const b = bench("id-charset");
  try {
    for (const id of ["../../../etc/evil-a1", "../escape-a1", "/absolute/evil-a1", "runs/../../escape-a1", "a b-a1"]) {
      let refused: unknown;
      try { recordPath(b.root, id); } catch (err) { refused = err; }
      expect(refused, `the attempt id ${JSON.stringify(id)} reached the filesystem unvalidated`).toBeInstanceOf(RunRecordFinding);
    }
    let started: unknown;
    try {
      startRun(b.root, { assignment: assignment(b, { id: "../../../tmp/evil" }), at: "2026-09-12T00:00:00.000Z", io: io() });
    } catch (err) { started = err; }
    expect(started, "an assignment whose work id is a path fragment started a run").toBeInstanceOf(RunRecordFinding);
    // THE POSITIVE CONTROL: the ids this project actually uses still resolve, INSIDE the runs directory.
    const runs = path.join(b.root, ".supertaskr", "runs");
    for (const id of ["T-311-a1", "T-311-s4-a12", "T-900-a1"]) {
      expect(recordPath(b.root, id).startsWith(runs), `${id} does not resolve under the runs directory`).toBe(true);
    }
    expect(
      startRun(b.root, { assignment: assignment(b), at: "2026-09-12T00:00:01.000Z", io: io() }).record.attempt,
      "the control assignment could not start",
    ).toBe(`${WORK}-a1`);
  } finally { b.cleanup(); }
});

/* ════════════════════════════════════════════════════════════════════
 * T-324 — THE ADMISSION LIFECYCLE AT THE RUN RECORD'S OWN BOUNDARIES.
 *
 * The three boundaries this file owns are the CHILD START, the RE-ENTRY
 * and the REPLACEMENT WRITER; the fourth, the lane cut, is the dispatch
 * arm's and is graded in `brief.spec.ts` beside the rest of the reader.
 *
 * **EVERY BENCH ABOVE IS A BARE DIRECTORY AND THEREFORE THE NO-GRANT
 * STATE**, which is why not one of the T-311 bodies changed: a tree with
 * no `dispatch:` block admits everything and enforces nothing, and this
 * project's own template is exactly that tree. The benches below are the
 * other arrangement — a real git fixture carrying the SHIPPED schema, a
 * template with a block in it, and cards whose blobs the grant records —
 * because a refusal can only be measured where there is a grant to
 * refuse against.
 * ════════════════════════════════════════════════════════════════════ */

/** A git invocation inside a fixture, with the background-maintenance race shut off. */
function fixtureGit(dir: string, argv: string[]): string {
  const r = spawnSync("git", ["-C", dir, ...NO_BACKGROUND_MAINTENANCE, ...argv], { encoding: "utf8" });
  if (r.status !== 0) {
    throw new Error(`fixture git ${argv.join(" ")} failed: ${String(r.stderr ?? "")}`);
  }
  return String(r.stdout ?? "");
}

interface GrantBench extends Bench {
  /** the blob sha of a fixture card AS IT STANDS — what the grant records at approval */
  blob(id: string): string;
  /** rewrite a fixture card whole */
  rewrite(id: string, text: string): void;
  /** the fixture card's text */
  cardText(id: string): string;
  /** write the runtime template's dispatch block */
  grant(block: string): void;
  /** write (or clear) the owner's pause record */
  pause(rec: object | null): void;
}

/** A fixture card, complete enough for the board reader and nothing more. */
function fixtureCard(id: string, status = "planned"): string {
  return [
    "---",
    `id: ${id}`,
    `title: "a fixture card for the admission lifecycle"`,
    "feature: F-00",
    "milestone: 0",
    "size: S",
    `status: ${status}`,
    "touches: [docs/tasks]",
    "---",
    "",
    "## Acceptance criteria",
    "",
    "- WHEN a fixture is read THE reader SHALL find a card.",
    "",
    "## Implementation notes",
    "",
    "## Verdicts",
    "",
  ].join("\n");
}

/**
 * A BENCH WITH A GRANT TO REFUSE AGAINST.
 *
 * **THE SCHEMA IS THE SHIPPED ONE, COPIED RATHER THAN INVENTED.** The
 * declaration is what every refusal below is validated against, so a
 * fixture declaration of its own would be a body checking the arm
 * against a schema nobody ships — the fixture would share the property
 * it asserts, which is the failure T-210 named.
 */
function grantBench(stem: string, cards: string[]): GrantBench {
  const b = bench(stem);
  // THE TEARDOWN IS THE SHARED ONE (T-178), because this bench COMMITS
  // into a repository it later removes: a detached `git maintenance`
  // refilling `.git/objects` between the walk's readdir and its rmdir is
  // what reds whichever body the teardown happens to follow. The commits
  // below spread `NO_BACKGROUND_MAINTENANCE` to remove the cause, and
  // this removal reports itself AS THE FIXTURE if it still cannot finish.
  const dir = path.dirname(b.root);
  b.cleanup = () => {
    const finding = removeGitFixture(dir, `grantBench(${stem})`);
    if (finding !== null) console.warn(finding);
  };
  fixtureGit(b.root, ["init", "-q", "."]);
  fixtureGit(b.root, ["config", "user.email", "fixture@example.invalid"]);
  fixtureGit(b.root, ["config", "user.name", "fixture"]);
  mkdirSync(path.join(b.root, "method", "runtime"), { recursive: true });
  mkdirSync(path.join(b.root, "docs", "tasks"), { recursive: true });
  writeFileSync(
    path.join(b.root, "method", "runtime", "process-schema.yaml"),
    readFileSync(path.join(repoRoot, "method/runtime/process-schema.yaml"), "utf8"),
  );
  const file = (id: string) => `docs/tasks/${id}-a-fixture-card.md`;
  for (const id of cards) writeFileSync(path.join(b.root, file(id)), fixtureCard(id));
  writeFileSync(path.join(b.root, "method", "runtime", "supertaskr.yaml"), "roles:\n  executor: fixture@subagent\n");
  fixtureGit(b.root, ["add", "-A"]);
  fixtureGit(b.root, ["commit", "-q", "-m", "the fixture tree"]);
  return {
    ...b,
    blob: (id) => fixtureGit(b.root, ["hash-object", "--", file(id)]).trim(),
    cardText: (id) => readFileSync(path.join(b.root, file(id)), "utf8"),
    rewrite: (id, text) => {
      writeFileSync(path.join(b.root, file(id)), text);
    },
    // T-344: THE GRANT IS PLANTED IN THE BENCH'S OWN OPERATIONAL STORE.
    //
    // Until that card this wrote the block into the bench's runtime
    // TEMPLATE, which is where the active grant used to live. The
    // template is a shipped code input the Rust kit embeds, so an
    // approval recorded there cost a full publication and rode into
    // every project the kit scaffolds; the active grant lives in an
    // untracked store at the designated integration checkout now, and a
    // block left in a template is a stray the arm reports and never
    // obeys. So the bench plants its grant where the reader will look
    // for it — in the bench's OWN `.supertaskr/`, never this project's,
    // which is T-330's rule applied to the file that replaced the one
    // T-330 was written about.
    //
    // THE BENCH ROOT IS A FRESH `git init` REPOSITORY ON ITS OWN BRANCH,
    // which is why it classifies as a checkout that may hold a store:
    // the location check RULES OUT a linked worktree, a detached head
    // and a task branch, and what pins a store to ONE checkout is the
    // location the snapshot itself records and the reader compares.
    grant: (block) => {
      const store = path.join(b.root, GRANT_STORE_REL_PATH);
      if (block.trim() === "") {
        // AN EMPTY BLOCK IS THE NO-GRANT STATE AND THEREFORE CLEARS THE
        // WHOLE STORE. A snapshot removed while a journal remains is
        // PRIOR USE, which the reader refuses rather than reading as no
        // grant — and a bench that wanted the no-grant state would be
        // measuring the refusal instead.
        for (const rel of [GRANT_STORE_REL_PATH, GRANT_JOURNAL_REL_PATH, GRANT_SUPERSEDED_REL_PATH]) {
          rmSync(path.join(b.root, rel), { force: true });
        }
        return;
      }
      const schema = parseProcessSchema(
        readFileSync(path.join(b.root, "method", "runtime", "process-schema.yaml"), "utf8"),
      );
      const revision = dispatchBlock(block, schema).grant?.revision ?? 0;
      mkdirSync(path.dirname(store), { recursive: true });
      writeFileSync(
        store,
        composeGrantSnapshot({
          blockText: block,
          root: realpathSync(b.root),
          revision,
          writtenBy: "the admission bench",
        }),
      );
    },
    pause: (rec) => {
      const at = path.join(b.root, ".supertaskr", "pause.json");
      mkdirSync(path.dirname(at), { recursive: true });
      if (rec === null) rmSync(at, { force: true });
      else writeFileSync(at, `${JSON.stringify(rec, null, 2)}\n`);
    },
  };
}

/** The template's dispatch block, spelled the way the shipped declaration reads it. */
function grantBlock(o: {
  approval: string;
  recovery: string;
  order: string[];
  blobs: Record<string, string>;
  until?: string;
  revision?: number;
  revoked?: { at: string; by: string };
  limits?: { tokens: Record<string, number>; expiresAt: string };
}): string {
  const lines = [
    "dispatch:",
    `  approval: ${o.approval}`,
    `  recovery: ${o.recovery}`,
    "  grant:",
    '    given_by: "the fixture owner"',
    '    at: "2026-09-14T00:00:00Z"',
    `    revision: ${String(o.revision ?? 1)}`,
    `    order: [${o.order.join(", ")}]`,
    ...(o.until === undefined ? [] : [`    until: ${o.until}`]),
    "    cards:",
    ...o.order.map((id) => `      ${id}: ${o.blobs[id] as string}`),
  ];
  if (o.revoked !== undefined) {
    lines.push("  revoked:", `    at: "${o.revoked.at}"`, `    by: "${o.revoked.by}"`);
  }
  if (o.limits !== undefined) {
    lines.push("  limits:", "    tokens:");
    for (const [k, v] of Object.entries(o.limits.tokens)) lines.push(`      ${k}: ${String(v)}`);
    lines.push(`    expires_at: "${o.limits.expiresAt}"`);
  }
  lines.push("  history: []", "");
  return lines.join("\n");
}

/** An assignment naming one of the fixture's own cards. */
function grantAssignment(b: GrantBench, id: string, over: Partial<Assignment> = {}): Assignment {
  writeFileSync(path.join(b.scratch, `brief-${id}.txt`), `the brief ${id} is answerable to\n`);
  return {
    kind: "card",
    id,
    role: "executor",
    resource: b.lane,
    harness: "claude-code",
    model: "claude-opus-5",
    effort: "high",
    base: "f608f5fa617f36e9ef30ed7806d32b54bff00bad",
    brief: path.join(b.scratch, `brief-${id}.txt`),
    cwd: b.lane,
    deadline: "none",
    budget: "none",
    ...over,
  };
}

/** Start a run and give back the refusal, or `null` where it was admitted. */
function refusalOfStart(root: string, a: Assignment, at: string): { code: string; message: string } | null {
  try {
    startRun(root, { assignment: a, at, io: io() });
    return null;
  } catch (err) {
    if (err instanceof Error && "code" in err) {
      return { code: String((err as { code: unknown }).code), message: err.message };
    }
    throw err;
  }
}

/** Every reservation file the bench holds right now. */
function reservationsIn(root: string): string[] {
  const dir = path.join(root, ".supertaskr", "runs", "reservations");
  return existsSync(dir) ? readdirSync(dir) : [];
}

/** Every record the bench holds, newest last, as the ledger derives them. */
function recordsIn(root: string): RunRecord[] {
  const dir = path.join(root, ".supertaskr", "runs");
  if (!existsSync(dir)) return [];
  const out: RunRecord[] = [];
  for (const work of readdirSync(dir)) {
    const at = path.join(dir, work);
    if (work === "reservations" || !existsSync(at)) continue;
    for (const f of readdirSync(at)) {
      if (f.endsWith(".json")) out.push(JSON.parse(readFileSync(path.join(at, f), "utf8")) as RunRecord);
    }
  }
  return out.sort((x, y) => x.attempt.localeCompare(y.attempt));
}

test("THE ADMISSION COMES BEFORE THE RESERVATION — a child start the grant does not approve takes no lock and writes no record", () => {
  // THE CARD'S FIRST CRITERION, at the child-start boundary. The order
  // is the property: a reservation taken for work nobody admitted is a
  // writer this loop had no authority to start, and a refusal AFTER the
  // take would leave a lock behind for the next arm to reconcile.
  //
  // KILLED BY: an admission checked after `takeReservation`, an
  // admission not checked at all, and a refusal that wrote the record
  // anyway.
  const b = grantBench("admission-before-reservation", ["T-901", "T-902"]);
  try {
    b.grant(grantBlock({
      approval: "each",
      recovery: "none",
      order: ["T-901"],
      blobs: { "T-901": b.blob("T-901") },
    }));
    const refused = refusalOfStart(b.root, grantAssignment(b, "T-902"), "2026-09-14T00:00:01.000Z");
    expect(refused?.code, "a card the grant does not name was admitted").toBe("ADMISSION_CARD_NOT_APPROVED");
    expect(refused?.message, "the refusal does not name the card").toContain("T-902");
    expect(refused?.message, "the refusal does not name what the grant DOES approve").toContain("T-901");
    expect(reservationsIn(b.root), "a refused admission left a reservation behind").toEqual([]);
    expect(recordsIn(b.root), "a refused admission wrote a record").toEqual([]);

    // THE POSITIVE CONTROL, AND IT IS WHERE THE ARRANGEMENT IS ABSENT:
    // the same bench, the same command, the card the grant DOES name.
    const ok = startRun(b.root, {
      assignment: grantAssignment(b, "T-901"),
      at: "2026-09-14T00:00:02.000Z",
      io: io(),
    });
    expect(ok.record.admission?.admitted, "the control: an approved card was refused").toBe(true);
    expect(ok.record.admission?.kind, "the control: the kind").toBe("explicit");
    expect(ok.record.admission?.boundary, "the control: the boundary").toBe("child-start");
    expect(ok.record.admission?.consumed, "the control: the approval was not consumed").toBe(true);
    expect(ok.record.admission?.revision, "the control: the grant revision it binds to").toBe(1);
    expect(ok.record.admission?.blob, "the control: the card blob it binds to").toBe(b.blob("T-901"));
    expect(ok.record.admission?.resource, "the control: the reservation it binds to").toBe(path.resolve(b.lane));
    expect(reservationsIn(b.root).length, "the control took no reservation").toBe(1);
  } finally {
    b.cleanup();
  }
});

test("A CONSUMED APPROVAL PRESENTED AGAIN IS REFUSED AS CONSUMED under `each`, and the same second run is admitted under `standing`", () => {
  // THE CARD'S FIRST CRITERION's own body list, and the second criterion's
  // `each` clause: the grant's list is PER-CARD APPROVALS and never a
  // batch, so a card's approval is spent once. The `standing` half is the
  // POSITIVE CONTROL and it is the arrangement where the refusal must be
  // ABSENT — without it a reader cannot tell "spent" from "this arm
  // refuses every second run".
  //
  // KILLED BY: a consumption that never records, a ledger that reads a
  // finished attempt as still holding the approval, and a `standing`
  // grant that inherited `each`'s spending.
  for (const [approval, secondIsRefused] of [
    ["each", true],
    ["standing", false],
  ] as const) {
    const b = grantBench(`consumed-${approval}`, ["T-901"]);
    try {
      b.grant(grantBlock({ approval, recovery: "none", order: ["T-901"], blobs: { "T-901": b.blob("T-901") } }));
      const first = startRun(b.root, {
        assignment: grantAssignment(b, "T-901"),
        at: "2026-09-14T00:00:01.000Z",
        io: io(),
      });
      // THE FIRST ATTEMPT IS CARRIED TO A TERMINAL STATE, because an OPEN
      // admission is a re-presentation rather than a second consumption —
      // which is the distinction this body exists to hold.
      bindRun(b.root, { attempt: first.record.attempt, harnessId: "harness-1", at: "2026-09-14T00:00:02.000Z", io: io() });
      observeRun(b.root, {
        attempt: first.record.attempt,
        evidence: `${DONE_TOKEN} ok`,
        at: "2026-09-14T00:00:03.000Z",
        io: io(),
      });
      collectRun(b.root, { attempt: first.record.attempt, at: "2026-09-14T00:00:04.000Z", io: io() });
      expect(
        TERMINAL_STATES.includes(readRecord(b.root, first.record.attempt).state),
        `${approval}: the first attempt did not reach a terminal state, so this body proves nothing`,
      ).toBe(true);

      const second = refusalOfStart(b.root, grantAssignment(b, "T-901"), "2026-09-14T00:00:05.000Z");
      if (secondIsRefused) {
        expect(second?.code, "a spent approval was spent twice").toBe("ADMISSION_APPROVAL_CONSUMED");
        expect(second?.message, "the refusal does not name the attempt that consumed it").toContain(
          first.record.attempt,
        );
        expect(reservationsIn(b.root), "a refused second run left a reservation behind").toEqual([]);
      } else {
        expect(second, "the control: a standing grant refused a second run as consumed").toBeNull();
      }
    } finally {
      b.cleanup();
    }
  }
});

for (const approval of ["each", "until", "standing"] as const) {
  for (const recovery of ["none", "repairs"] as const) {
    test(`THE MODE AND THE POLICY ARE ENFORCED TOGETHER — approval \`${approval}\` paired with recovery \`${recovery}\``, () => {
      // THE CARD'S SECOND CRITERION, which asks for a body per mode
      // paired with EACH recovery value — six arrangements, because the
      // two are orthogonal and an implementation that read one off the
      // other would pass any three of them.
      //
      // KILLED BY: an `until` that admits past its endpoint, a
      // `standing` that stops at one, an `each` that admits a card it
      // does not name, a `none` that admits a derived repair, and a
      // `repairs` that refuses one.
      const b = grantBench(`mode-${approval}-${recovery}`, ["T-901", "T-902", "T-903", "T-904"]);
      try {
        const order = ["T-901", "T-902", "T-903"];
        b.grant(grantBlock({
          approval,
          recovery,
          order,
          ...(approval === "until" ? { until: "T-902" } : {}),
          blobs: Object.fromEntries(order.map((id) => [id, b.blob(id)])),
        }));
        // THE FIRST CARD OF THE ORDER IS ADMITTED UNDER EVERY MODE.
        const first = startRun(b.root, {
          assignment: grantAssignment(b, "T-901"),
          at: "2026-09-14T00:00:01.000Z",
          io: io(),
        });
        expect(first.record.admission?.admitted, `${approval}: the first card of the order was refused`).toBe(true);

        // A CARD OUTSIDE THE ORDER IS REFUSED UNDER EVERY MODE: an
        // explicit admission is of a card the grant NAMES, and `standing`
        // is a grant that runs until a pause rather than a grant of
        // everything.
        const outside = refusalOfStart(
          b.root,
          grantAssignment(b, "T-904", { resource: "none" }),
          "2026-09-14T00:00:02.000Z",
        );
        expect(outside?.code, `${approval}: a card outside the order was admitted`).toBe(
          "ADMISSION_CARD_NOT_APPROVED",
        );

        // THE ENDPOINT IS `until`'s ALONE. `T-903` is inside the order
        // and AFTER the endpoint, so it is refused by name under `until`
        // and admitted under the two modes that have no endpoint.
        const past = refusalOfStart(
          b.root,
          grantAssignment(b, "T-903", { resource: "none" }),
          "2026-09-14T00:00:03.000Z",
        );
        if (approval === "until") {
          expect(past?.code, "a card after the until endpoint was admitted").toBe("ADMISSION_UNTIL_ENDPOINT");
          expect(past?.message, "the refusal does not name the endpoint").toContain("T-902");
          expect(past?.message, "the refusal does not name the card it refused").toContain("T-903");
        } else {
          expect(past, `${approval}: a mode with no endpoint refused a card inside its order`).toBeNull();
        }

        // AND THE RECOVERY POLICY IS THE OTHER AXIS, read at the same
        // boundary: a DERIVED repair of the card just admitted.
        const repair = refusalOfStart(
          b.root,
          grantAssignment(b, "T-904", {
            resource: "none",
            admission: { kind: "derived", parent: "T-901", evidence: "the fixture delivery failed", scope: "repair" },
          }),
          "2026-09-14T00:00:04.000Z",
        );
        if (recovery === "none") {
          expect(repair?.code, "a derived repair was admitted under recovery none").toBe(
            "ADMISSION_RECOVERY_NONE",
          );
          expect(repair?.message, "the refusal does not say what the repair needs instead").toContain(
            "EXPLICIT APPROVAL",
          );
        } else {
          expect(repair, "a derived repair of approved work was refused under recovery repairs").toBeNull();
          const derived = recordsIn(b.root).find((r) => r.assignment.id === "T-904");
          expect(derived?.admission?.kind, "the derived admission was not recorded as derived").toBe("derived");
          expect(derived?.admission?.parent, "the derived admission lost its parent").toBe("T-901");
          expect(derived?.admission?.revision, "a derived admission minted a grant of its own").toBe(1);
        }
        expect(first.record.attempt, "the first attempt id moved").toBe("T-901-a1");
      } finally {
        b.cleanup();
      }
    });
  }
}

test("THE REPAIR LIFECYCLE — one fixture, its stages in sequence: approved work, a failure, a derived repair, an out-of-scope repair refused, a repeated delivery producing no duplicate, and the endpoint's completion refusing the next feature", () => {
  // THE CARD'S THIRD CRITERION, and it asks for ONE fixture whose stages
  // are asserted IN SEQUENCE rather than six unrelated bodies — because
  // what is under test is a LIFECYCLE, and six independent arrangements
  // would each start from a state the one before it never produced.
  //
  // KILLED BY: a derived admission that does not need its parent to be
  // approved work, one admitted for a product-scope change, a repeated
  // delivery event minting a second repair, and an endpoint whose
  // completion opens the next card.
  const b = grantBench("repair-lifecycle", ["T-901", "T-902", "T-903", "T-904", "T-905"]);
  try {
    const order = ["T-901", "T-902"];
    b.grant(grantBlock({
      approval: "until",
      recovery: "repairs",
      order,
      until: "T-902",
      blobs: Object.fromEntries(order.map((id) => [id, b.blob(id)])),
    }));

    // ── STAGE 1: the authorized initial card is admitted and starts. ──
    const initial = startRun(b.root, {
      assignment: grantAssignment(b, "T-901"),
      at: "2026-09-14T01:00:00.000Z",
      io: io(),
    });
    expect(initial.record.admission?.kind, "stage 1: the initial card was not an explicit admission").toBe("explicit");
    bindRun(b.root, { attempt: initial.record.attempt, harnessId: "harness-lifecycle", at: "2026-09-14T01:00:01.000Z", io: io() });

    // ── STAGE 2: it FAILS, and the failure is on the record. ──────────
    observeRun(b.root, {
      attempt: initial.record.attempt,
      evidence: `${DONE_TOKEN} failed`,
      at: "2026-09-14T01:00:02.000Z",
      io: io(),
    });
    collectRun(b.root, { attempt: initial.record.attempt, at: "2026-09-14T01:00:03.000Z", io: io() });
    expect(
      TERMINAL_STATES.includes(readRecord(b.root, initial.record.attempt).state),
      "stage 2: the initial attempt never concluded, so there is no failure to repair",
    ).toBe(true);

    // ── STAGE 3: a PREVIOUSLY UNLISTED repair is admitted by derivation.
    const failure = "the keeper the delivery of T-901 owes is red at the tip";
    const repair = startRun(b.root, {
      assignment: grantAssignment(b, "T-903", {
        resource: "none",
        admission: { kind: "derived", parent: "T-901", evidence: failure, scope: "repair" },
      }),
      at: "2026-09-14T01:00:04.000Z",
      io: io(),
    });
    expect(repair.record.admission?.admitted, "stage 3: an in-scope repair of approved work was refused").toBe(true);
    expect(
      repair.record.admission?.card,
      "stage 3: the repair was admitted for a card the grant names, which would make it explicit",
    ).toBe("T-903");
    expect(
      order.includes("T-903"),
      "stage 3: the fixture's repair card is IN the order, so this stage proves nothing",
    ).toBe(false);
    expect(repair.record.admission?.parent, "stage 3: the repair did not bind to its parent").toBe("T-901");
    expect(repair.record.admission?.consumed, "stage 3: the repair re-presented an admission instead of making one").toBe(true);

    // ── STAGE 4: an OUT-OF-SCOPE repair is refused. ───────────────────
    const outOfScope = refusalOfStart(
      b.root,
      grantAssignment(b, "T-904", {
        resource: "none",
        admission: { kind: "derived", parent: "T-901", evidence: failure, scope: "product-change" },
      }),
      "2026-09-14T01:00:05.000Z",
    );
    expect(outOfScope?.code, "stage 4: a product-scope change was admitted as a repair").toBe(
      "ADMISSION_DERIVED_OUT_OF_SCOPE",
    );
    const waived = refusalOfStart(
      b.root,
      grantAssignment(b, "T-905", {
        resource: "none",
        admission: { kind: "derived", parent: "T-901", evidence: failure, scope: "waived-verification" },
      }),
      "2026-09-14T01:00:06.000Z",
    );
    expect(waived?.code, "stage 4: a repair that waives its verification was admitted").toBe(
      "ADMISSION_DERIVED_OUT_OF_SCOPE",
    );

    // ── STAGE 5: the SAME delivery event, reported again, produces no
    //    second repair — it RE-PRESENTS the admission stage 3 made.
    const again = startRun(b.root, {
      assignment: grantAssignment(b, "T-903", {
        resource: "none",
        admission: { kind: "derived", parent: "T-901", evidence: failure, scope: "repair" },
      }),
      at: "2026-09-14T01:00:07.000Z",
      io: io(),
    });
    expect(again.record.admission?.consumed, "stage 5: a repeated delivery event minted a second repair").toBe(false);
    expect(again.record.admission?.reuses, "stage 5: the repeat did not re-present the first repair's admission").toBe(
      repair.record.attempt,
    );
    // AND A DIFFERENT FAILURE IS A DIFFERENT REPAIR — the control that
    // says stage 5 measured the EVIDENCE rather than the card id.
    const other = startRun(b.root, {
      assignment: grantAssignment(b, "T-903", {
        resource: "none",
        admission: { kind: "derived", parent: "T-901", evidence: "a second, different failure", scope: "repair" },
      }),
      at: "2026-09-14T01:00:08.000Z",
      io: io(),
    });
    expect(other.record.admission?.consumed, "the control: a different failure re-presented the first repair").toBe(true);

    // ── STAGE 6: the until endpoint's COMPLETION refuses the next
    //    feature by name. A parked or a delivered endpoint alike: the
    //    grant runs up to and including it and no further.
    const endpoint = startRun(b.root, {
      assignment: grantAssignment(b, "T-902", { resource: "none" }),
      at: "2026-09-14T01:00:09.000Z",
      io: io(),
    });
    bindRun(b.root, { attempt: endpoint.record.attempt, harnessId: "harness-endpoint", at: "2026-09-14T01:00:10.000Z", io: io() });
    observeRun(b.root, {
      attempt: endpoint.record.attempt,
      evidence: `${DONE_TOKEN} ok`,
      at: "2026-09-14T01:00:11.000Z",
      io: io(),
    });
    collectRun(b.root, { attempt: endpoint.record.attempt, at: "2026-09-14T01:00:12.000Z", io: io() });
    const next = refusalOfStart(
      b.root,
      grantAssignment(b, "T-904", { resource: "none" }),
      "2026-09-14T01:00:13.000Z",
    );
    expect(next?.code, "stage 6: the next feature ran on the completed grant's authority").toBe(
      "ADMISSION_CARD_NOT_APPROVED",
    );
  } finally {
    b.cleanup();
  }
});

test("A PAUSE DISTINGUISHES NEW WORK FROM THE VERIFICATION OF A CANDIDATE ALREADY ADMITTED — the verifier starts, the replacement executor does not, and an `all` pause refuses that verifier too", () => {
  // THE CARD'S FOURTH CRITERION, and its three pinned bodies in one
  // sequence because the third is the same verifier the second admitted:
  // an arrangement, not three.
  //
  // KILLED BY: a pause that stops everything, a pause that stops nothing,
  // a `new-work` scope that lets a replacement executor through, and an
  // `all` scope that still admits the verification.
  const b = grantBench("pause-scopes", ["T-901"]);
  try {
    b.grant(grantBlock({
      approval: "standing",
      recovery: "none",
      order: ["T-901"],
      blobs: { "T-901": b.blob("T-901") },
    }));
    // AN EXECUTOR CANDIDATE, ADMITTED AND STARTED BEFORE ANY PAUSE.
    const executor = startRun(b.root, {
      assignment: grantAssignment(b, "T-901"),
      at: "2026-09-14T02:00:00.000Z",
      io: io(),
    });
    bindRun(b.root, { attempt: executor.record.attempt, harnessId: "harness-exec", at: "2026-09-14T02:00:01.000Z", io: io() });
    observeRun(b.root, {
      attempt: executor.record.attempt,
      evidence: `${DONE_TOKEN} ok`,
      at: "2026-09-14T02:00:02.000Z",
      io: io(),
    });

    // ── THE NEW-WORK PAUSE ───────────────────────────────────────────
    b.pause({ version: 1, at: "2026-09-14T02:10:00Z", by: "the fixture owner", scope: "new-work", why: "a scheduled hold" });

    // THE VERIFIER OF THE ADMITTED CANDIDATE IS PERMITTED TO START.
    const verifier = startRun(b.root, {
      assignment: grantAssignment(b, "T-901", { role: "verifier", resource: "none" }),
      at: "2026-09-14T02:10:01.000Z",
      io: io(),
    });
    expect(verifier.record.admission?.admitted, "a new-work pause stopped the verification of an admitted candidate").toBe(true);
    expect(verifier.record.admission?.phase, "the verifier's phase").toBe("verification");
    expect(verifier.record.admission?.reuses, "the verifier did not re-present the candidate's own admission").toBe(
      executor.record.attempt,
    );

    // A REPLACEMENT EXECUTOR UNDER THE SAME PAUSE IS REFUSED.
    const replacement = refusalOfStart(
      b.root,
      grantAssignment(b, "T-901", { resource: "none" }),
      "2026-09-14T02:10:02.000Z",
    );
    expect(replacement?.code, "a new-work pause admitted a fresh implementation attempt").toBe(
      "ADMISSION_PAUSED_NEW_WORK",
    );
    expect(replacement?.message, "the refusal does not name who recorded the pause").toContain("the fixture owner");

    // ── THE `all` PAUSE STOPS THE VERIFIER TOO ───────────────────────
    b.pause({ version: 1, at: "2026-09-14T02:20:00Z", by: "the fixture owner", scope: "all" });
    const stopped = refusalOfStart(
      b.root,
      grantAssignment(b, "T-901", { role: "verifier", resource: "none" }),
      "2026-09-14T02:20:01.000Z",
    );
    expect(stopped?.code, "an `all` pause still admitted the verification").toBe("ADMISSION_PAUSED_ALL");
    expect(stopped?.message, "the refusal does not name the safe boundary each phase stops at").toContain(
      "SAFE BOUNDARY",
    );
    expect(stopped?.message, "the refusal does not route an immediate stop elsewhere").toContain("IMMEDIATE stop");

    // AND A PAUSE RECORD THIS READER CANNOT PARSE IS NEVER READ AS "NO
    // PAUSE" — the one case where guessing costs the most.
    writeFileSync(path.join(b.root, ".supertaskr", "pause.json"), "{ not json\n");
    const unreadable = refusalOfStart(
      b.root,
      grantAssignment(b, "T-901", { resource: "none" }),
      "2026-09-14T02:30:00.000Z",
    );
    expect(unreadable?.code, "an unreadable pause record was read as silence").toBe("ADMISSION_SCOPE");

    // THE POSITIVE CONTROL, WHERE THE ARRANGEMENT IS ABSENT: with the
    // record gone, the same replacement executor is admitted.
    b.pause(null);
    expect(
      refusalOfStart(b.root, grantAssignment(b, "T-901", { resource: "none" }), "2026-09-14T02:40:00.000Z"),
      "the control: with no pause recorded, a fresh attempt was still refused",
    ).toBeNull();
  } finally {
    b.cleanup();
  }
});

test("A RETRY OF AN INTERRUPTED ADMISSION NEITHER CONSUMES AN APPROVAL TWICE NOR CREATES A SECOND WRITER — and an UNCERTAIN old writer holds the admission until it is reconciled", () => {
  // THE CARD'S FIRST CRITERION, and the interruption is REAL: the attempt
  // is left `reserved` with its lock held and nothing bound, which is
  // exactly the state the spawn happens in and the one the recovery day
  // of 2026-09-11 had to reconstruct from worktrees. Calling `startRun`
  // twice would be a different arrangement and would prove nothing about
  // a retry.
  //
  // KILLED BY: a continuation that consumes a second approval, one that
  // takes a second reservation, and a reconciliation whose `undetermined`
  // still let the admission move.
  const b = grantBench("interrupted-retry", ["T-901"]);
  try {
    b.grant(grantBlock({
      approval: "each",
      recovery: "none",
      order: ["T-901"],
      blobs: { "T-901": b.blob("T-901") },
    }));
    const started = startRun(b.root, {
      assignment: grantAssignment(b, "T-901"),
      at: "2026-09-14T03:00:00.000Z",
      io: io(),
    });
    // THE INTERRUPTION. Nothing is bound, the reservation is held, and
    // the record says `reserved` — the arm died between the take and the
    // bind, which is the window the reservation exists for.
    expect(readRecord(b.root, started.record.attempt).state, "the interruption did not leave a reserved attempt").toBe(
      "reserved",
    );
    expect(reservationsIn(b.root).length, "the interrupted attempt left no reservation to find").toBe(1);

    // AN UNCERTAIN OLD WRITER HOLDS THE ADMISSION. The reconciliation
    // cannot tell an un-started attempt from a running child nothing
    // named, so it answers `undetermined` and the continuation refuses.
    let held: unknown;
    try {
      continueRun(b.root, { attempt: started.record.attempt, at: "2026-09-14T03:00:01.000Z", io: io() });
    } catch (err) {
      held = err;
    }
    expect(held, "a continuation ran while the prior execution might still exist").toBeInstanceOf(RunRecordFinding);
    expect((held as RunRecordFinding).code, "the refusal's code").toBe("CONTINUE_UNCERTAIN");
    const afterRefusal = recordsIn(b.root);
    expect(afterRefusal.length, "the refused continuation wrote a second record").toBe(1);
    expect(
      afterRefusal[0]?.attempt,
      "the refused continuation moved the admission",
    ).toBe(started.record.attempt);
    expect(reservationsIn(b.root).length, "the refused continuation touched the reservation").toBe(1);

    // NOW THE TERMINATION IS ESTABLISHED — the seat reads its own harness
    // and passes the evidence — and the retry re-presents the SAME
    // admission rather than spending a second approval.
    const carried = continueRun(b.root, {
      attempt: started.record.attempt,
      evidence: `${DONE_TOKEN} gone`,
      at: "2026-09-14T03:00:02.000Z",
      io: io(),
    });
    expect(carried.record.admission?.consumed, "a retry of an interrupted admission consumed a second approval").toBe(
      false,
    );
    expect(carried.record.admission?.reuses, "the retry did not re-present its own admission").toBe(
      started.record.attempt,
    );
    expect(carried.record.admission?.boundary, "the retry's boundary").toBe("re-entry");
    expect(reservationsIn(b.root).length, "the retry created a second writer").toBe(1);
    expect(
      readReservation(b.root, b.lane)?.attempt,
      "the retry moved the reservation to somebody else",
    ).toBe(started.record.attempt);

    // AND A REPLACEMENT WRITER INHERITS THE SAME ADMISSION, still
    // spending nothing: the approval was consumed once, at the start.
    const replaced = continueRun(b.root, {
      attempt: carried.record.attempt,
      replace: true,
      evidence: `${DONE_TOKEN} gone`,
      at: "2026-09-14T03:00:03.000Z",
      io: io(),
    });
    expect(replaced.record.admission?.consumed, "a replacement writer consumed a second approval").toBe(false);
    expect(replaced.record.attempt, "the replacement did not take a fresh attempt id").not.toBe(
      carried.record.attempt,
    );
    expect(reservationsIn(b.root).length, "the replacement left two reservations over one resource").toBe(1);
  } finally {
    b.cleanup();
  }
});

test("THE GRANT'S LIMITS ARE READ, REPORTED BY NAME AS ADVISORY, AND ENFORCED BY NOTHING — an expiry that has passed refuses no admission", () => {
  // THE CARD'S FIFTH CRITERION. The point of the criterion is that a
  // control must not silently do nothing: the limits are recorded and
  // rendered, so they are REPORTED BY NAME as unenforced rather than
  // left to look like a ceiling somebody is keeping.
  //
  // KILLED BY: limits that quietly refuse, limits that are read and never
  // reported, and an absence that invents a ceiling.
  const b = grantBench("limits-advisory", ["T-901"]);
  try {
    b.grant(grantBlock({
      approval: "standing",
      recovery: "none",
      order: ["T-901"],
      blobs: { "T-901": b.blob("T-901") },
      limits: { tokens: { anthropic: 5000000 }, expiresAt: "2020-01-01T00:00:00Z" },
    }));
    const started = startRun(b.root, {
      assignment: grantAssignment(b, "T-901"),
      at: "2026-09-14T04:00:00.000Z",
      io: io(),
    });
    expect(
      started.record.admission?.admitted,
      "a grant whose recorded expiry has long passed refused an admission this card does not enforce",
    ).toBe(true);
    const advisory = started.record.admission?.advisory ?? [];
    expect(
      advisory.some((l) => l.includes("limits.tokens.anthropic") && l.includes("5000000")),
      "the token ceiling was not reported by name",
    ).toBe(true);
    expect(
      advisory.some((l) => l.includes("limits.expires_at") && l.includes("2020-01-01")),
      "the expiry was not reported by name",
    ).toBe(true);
    for (const line of advisory) {
      expect(line.includes("ADVISORY"), `a limits line does not say it is advisory: ${line}`).toBe(true);
    }
    // AND THE ABSENCE IMPOSES NOTHING — the same grant with no limits
    // block says so in as many words rather than saying nothing.
    b.grant(grantBlock({
      approval: "standing",
      recovery: "none",
      order: ["T-901"],
      blobs: { "T-901": b.blob("T-901") },
    }));
    const bare = startRun(b.root, {
      assignment: grantAssignment(b, "T-901", { resource: "none" }),
      at: "2026-09-14T04:00:01.000Z",
      io: io(),
    });
    expect(
      (bare.record.admission?.advisory ?? []).join(" "),
      "an absent limits block said nothing about the ceiling it does not impose",
    ).toContain("imposes NO token or time ceiling");
  } finally {
    b.cleanup();
  }
});

test("THE ARM'S RUN REPORT KEEPS THE REFUSALS IT TESTED APART FROM THE COORDINATOR'S OBLIGATIONS AND FROM THE ADVISORY ACCOUNTING", () => {
  // THE CARD'S SEVENTH CRITERION, the report half. A list that mixed the
  // three would let the second and the third borrow the first's
  // authority, which is exactly how a guarantee gets overstated.
  //
  // KILLED BY: a report that prints the obligations as refusals, one that
  // drops them, and one that never names the three the criterion does.
  const b = grantBench("report-groups", ["T-901"]);
  try {
    b.grant(grantBlock({
      approval: "each",
      recovery: "repairs",
      order: ["T-901"],
      blobs: { "T-901": b.blob("T-901") },
    }));
    const started = startRun(b.root, {
      assignment: grantAssignment(b, "T-901"),
      at: "2026-09-14T05:00:00.000Z",
      io: io(),
    });
    const rendered = runRecs(
      { at: "2026-09-14T05:00:00.000Z", host: "fixture-host", root: b.root },
      "start",
      started.record,
      [],
    )
      .map((r) => ("text" in r ? r.text : ""))
      .join("\n");
    expect(rendered, "the report does not label what this arm actually refused").toContain(
      "THE REFUSALS THIS ARM TESTED",
    );
    expect(rendered, "the report does not separate the advisory accounting").toContain("ADVISORY ACCOUNTING");
    expect(rendered, "the report does not separate the coordinator's obligations").toContain(
      "THE COORDINATOR'S, NOT THIS ARM'S",
    );
    for (const owed of ["SCOPE INTERPRETATION", "AN UNREPORTED INTEGRITY PROBLEM", "A PROVIDER'S LIVE USAGE"]) {
      expect(rendered, `the report does not name the obligation ${owed}`).toContain(owed);
    }
    // THE THREE ARE NOT ONE LIST: no obligation line carries the tested
    // label, which is the property "kept apart" actually means.
    for (const line of rendered.split("\n").filter((l: string) => l.includes("THE COORDINATOR'S, NOT THIS ARM'S"))) {
      expect(line.includes("THE REFUSALS THIS ARM TESTED"), `an obligation borrowed the refusals' label: ${line}`).toBe(
        false,
      );
    }
  } finally {
    b.cleanup();
  }
});

test("A CONSULTATION IS ADMITTED WHILE IT WRITES NOTHING, AND REFUSED THE MOMENT IT CLAIMS A RESOURCE", () => {
  // THE WORK SERVED IS NOT THE RESOURCE A CHILD MAY WRITE (T-311's own
  // design), and this card had to say what an admission means on the
  // read-only side of that split. A grant approves CARDS, so a
  // consultation can never appear in an order — refusing it would stop
  // the tool-less participant that runs beside an executor the owner
  // already approved. What is NOT covered is a consultation that claims
  // write ownership, and that is work needing its own approval whatever
  // the assignment calls it.
  //
  // KILLED BY: a reader that refuses every consultation as a card the
  // grant does not name, one that admits a consultation holding a lane,
  // and one that lets a consultation consume a card's approval.
  const b = grantBench("consultation", ["T-901"]);
  try {
    b.grant(grantBlock({
      approval: "each",
      recovery: "none",
      order: ["T-901"],
      blobs: { "T-901": b.blob("T-901") },
    }));
    writeFileSync(path.join(b.scratch, "brief-C-1.txt"), "the consultation's own brief\n");
    const readOnly: Assignment = {
      ...grantAssignment(b, "T-901"),
      kind: "consultation",
      id: "C-1",
      role: "verifier",
      resource: "none",
      brief: path.join(b.scratch, "brief-C-1.txt"),
    };
    const admitted = startRun(b.root, { assignment: readOnly, at: "2026-09-14T06:00:00.000Z", io: io() });
    expect(admitted.record.admission?.admitted, "a read-only consultation was refused by a grant of cards").toBe(true);
    expect(admitted.record.admission?.consumed, "a consultation consumed a card's approval").toBe(false);
    expect(admitted.record.admission?.revision, "the consultation did not bind to the grant's revision").toBe(1);
    expect(admitted.record.reservation.takenAt, "a read-only participant took a writer reservation").toBeNull();

    // AND THE APPROVED CARD'S OWN APPROVAL IS STILL THERE TO SPEND,
    // which is what "consumed no approval" has to mean on disk.
    const card = startRun(b.root, {
      assignment: grantAssignment(b, "T-901"),
      at: "2026-09-14T06:00:01.000Z",
      io: io(),
    });
    expect(card.record.admission?.consumed, "the consultation had spent the card's approval after all").toBe(true);

    // THE OTHER HALF, AND IT IS WHERE THE ARRANGEMENT DIFFERS BY ONE
    // FIELD: the same consultation claiming write ownership of the lane.
    const writer: Assignment = { ...readOnly, id: "C-2", resource: b.lane };
    writeFileSync(path.join(b.scratch, "brief-C-2.txt"), "the writing consultation's brief\n");
    const refused = refusalOfStart(
      b.root,
      { ...writer, brief: path.join(b.scratch, "brief-C-2.txt") },
      "2026-09-14T06:00:02.000Z",
    );
    expect(refused?.code, "a consultation claiming write ownership was admitted").toBe(
      "ADMISSION_CONSULTATION_WRITER",
    );
    expect(refused?.message, "the refusal does not name the resource it refused").toContain(path.resolve(b.lane));
  } finally {
    b.cleanup();
  }
});

/* ════════════════════════════════════════════════════════════════════
 * T-324 — THE VERIFIER'S THREE ASSIGNED CORRECTIONS, each a fail-open at
 * a boundary this card exists to close. They are here rather than in
 * `brief.spec.ts` because the property lives in `admit` and the only
 * fixture that can arm a grant, a pause and a ledger at once is the
 * `grantBench` above.
 * ════════════════════════════════════════════════════════════════════ */

test("A PAUSE THE OWNER RECORDED STOPS THE LOOP EVEN WHERE THERE IS NO GRANT TO ENFORCE — and a tree with no block is this project's own", () => {
  // THE FIRST ASSIGNED CORRECTION. A pause is not a row of the grant: it
  // is the owner's own record, and a tree with no `dispatch:` block —
  // which is this project's own template — is exactly the tree in which
  // the owner has nothing else to stop the loop with. Read after the
  // no-grant return, a WELL-FORMED pause stopped nothing here while a
  // MALFORMED one stopped everything, because `readPause` refuses before
  // `grantState` ever answers. This body holds the ordering that removes
  // that inversion.
  //
  // KILLED BY: a pause read after the no-grant state, and a pause read
  // only where a block exists.
  const b = grantBench("pause-without-a-grant", ["T-901"]);
  try {
    // NO GRANT IS WRITTEN. The bench's template carries no dispatch
    // block, which is the state this project's own template is in.
    b.pause({ version: 1, at: "2026-09-14T04:00:00Z", by: "the fixture owner", scope: "all", why: "stop everything" });
    const stopped = refusalOfStart(b.root, grantAssignment(b, "T-901"), "2026-09-14T04:00:01.000Z");
    expect(stopped?.code, "a pause recorded in a tree with no grant stopped nothing").toBe("ADMISSION_PAUSED_ALL");
    expect(stopped?.message, "the refusal does not name who recorded the pause").toContain("the fixture owner");
    expect(reservationsIn(b.root), "a refused start left a reservation behind").toEqual([]);
    expect(recordsIn(b.root), "a refused start wrote a record").toEqual([]);

    // AND THE INVERSION IS GONE: the unreadable record and the readable
    // one now both stop the loop, where before only the unreadable one
    // did — which is the shape that made this a defect rather than a
    // judgement about what a grantless tree should enforce.
    writeFileSync(path.join(b.root, ".supertaskr", "pause.json"), "{ not json\n");
    expect(
      refusalOfStart(b.root, grantAssignment(b, "T-901"), "2026-09-14T04:00:02.000Z")?.code,
      "an unreadable pause was read as silence in a tree with no grant",
    ).toBe("ADMISSION_SCOPE");

    // THE POSITIVE CONTROL, WHERE THE ARRANGEMENT IS ABSENT: with no
    // pause record at all the same grantless tree admits and says that
    // nothing was enforced, so the two refusals above are about the
    // PAUSE and not about a bench that refuses everything.
    b.pause(null);
    const open = startRun(b.root, {
      assignment: grantAssignment(b, "T-901"),
      at: "2026-09-14T04:00:03.000Z",
      io: io(),
    });
    expect(open.record.admission?.kind, "the control: a grantless tree with no pause refused a start").toBe(
      "unenforced",
    );
  } finally {
    b.cleanup();
  }
});

test("A `new-work` PAUSE PERMITS THE VERIFICATION OF A CANDIDATE ALREADY ADMITTED AND OF NOTHING ELSE — a verifier start for a card this loop never admitted is refused", () => {
  // THE SECOND ASSIGNED CORRECTION. The scope's own words are the
  // verification and integration OF THE ADMITTED CANDIDATE. A phase that
  // is not implementation is not by itself a candidate: admitting one
  // whose card no attempt ever admitted lets new work through a pause by
  // relabelling the seat, and spends that card's own approval doing it.
  //
  // KILLED BY: a pause branch that discriminates on the PHASE alone.
  const b = grantBench("pause-new-work-candidate", ["T-901", "T-902"]);
  try {
    b.grant(grantBlock({
      approval: "each",
      recovery: "none",
      order: ["T-901", "T-902"],
      blobs: { "T-901": b.blob("T-901"), "T-902": b.blob("T-902") },
    }));
    // T-901 IS ADMITTED AND STARTED BEFORE THE PAUSE. T-902 NEVER IS,
    // and the grant names both — so what separates them here is the
    // LEDGER and not the order.
    const admitted = startRun(b.root, {
      assignment: grantAssignment(b, "T-901"),
      at: "2026-09-14T05:00:00.000Z",
      io: io(),
    });
    b.pause({ version: 1, at: "2026-09-14T05:10:00Z", by: "the fixture owner", scope: "new-work" });

    const unadmitted = refusalOfStart(
      b.root,
      grantAssignment(b, "T-902", { role: "verifier", resource: "none" }),
      "2026-09-14T05:10:01.000Z",
    );
    expect(unadmitted?.code, "a new-work pause admitted a verifier for a card no attempt ever admitted").toBe(
      "ADMISSION_PAUSED_NEW_WORK",
    );
    expect(unadmitted?.message, "the refusal does not say why this verification is new work").toContain(
      "new work wearing a later phase's name",
    );
    // AN INTEGRATOR IS THE SAME ANSWER, because the scope names both
    // phases and neither is a candidate on its own.
    expect(
      refusalOfStart(
        b.root,
        grantAssignment(b, "T-902", { role: "integrator", resource: "none" }),
        "2026-09-14T05:10:02.000Z",
      )?.code,
      "a new-work pause admitted an integrator for a card no attempt ever admitted",
    ).toBe("ADMISSION_PAUSED_NEW_WORK");

    // THE POSITIVE CONTROL, WHERE THE ARRANGEMENT IS ABSENT: the
    // verifier of the card that WAS admitted still starts and still
    // re-presents that candidate's own admission, so the refusals above
    // are about the candidate and not about a pause that stops verifiers.
    const ofCandidate = startRun(b.root, {
      assignment: grantAssignment(b, "T-901", { role: "verifier", resource: "none" }),
      at: "2026-09-14T05:10:03.000Z",
      io: io(),
    });
    expect(
      ofCandidate.record.admission?.reuses,
      "the control: the verifier of an admitted candidate was refused or made a fresh admission",
    ).toBe(admitted.record.attempt);
    expect(ofCandidate.record.admission?.consumed, "the control: the permitted verification spent an approval").toBe(
      false,
    );
  } finally {
    b.cleanup();
  }
});

test("A DERIVED REPAIR CANNOT EXCEED THE AUTHORIZATION IT INHERITS — a parent past the `until` endpoint is refused, so the endpoint is not crossed by naming an unreachable parent", () => {
  // THE THIRD ASSIGNED CORRECTION. Membership of the order is not enough
  // under `until`: the grant runs up to and INCLUDING its endpoint, so a
  // card after it is work this grant would refuse, and a repair naming
  // it as its parent inherits an authorization the grant never made.
  // Criterion 2 admits only "the repairs that card's delivery needs",
  // and a card the grant does not reach delivers nothing.
  //
  // KILLED BY: a parent check that asks only whether the order names it.
  const b = grantBench("derived-past-the-endpoint", ["T-901", "T-902", "T-903", "T-904"]);
  try {
    const order = ["T-901", "T-902", "T-903"];
    b.grant(grantBlock({
      approval: "until",
      recovery: "repairs",
      order,
      until: "T-901",
      blobs: Object.fromEntries(order.map((id) => [id, b.blob(id)])),
    }));
    // T-903 IS IN THE ORDER AND PAST THE ENDPOINT, so the grant refuses
    // it outright — without which this body would prove nothing.
    expect(
      refusalOfStart(b.root, grantAssignment(b, "T-903", { resource: "none" }), "2026-09-14T06:00:00.000Z")?.code,
      "a card past the until endpoint was admitted, so this body proves nothing",
    ).toBe("ADMISSION_UNTIL_ENDPOINT");

    // AND A REPAIR OF IT IS REFUSED FOR THE SAME REASON.
    const beyond = refusalOfStart(
      b.root,
      grantAssignment(b, "T-904", {
        resource: "none",
        admission: { kind: "derived", parent: "T-903", evidence: "a failure of T-903", scope: "repair" },
      }),
      "2026-09-14T06:00:01.000Z",
    );
    expect(beyond?.code, "a repair crossed the until endpoint by naming an unreachable parent").toBe(
      "ADMISSION_DERIVED_NO_PARENT",
    );
    expect(beyond?.message, "the refusal does not name the endpoint it would have crossed").toContain("T-901");

    // THE POSITIVE CONTROL, WHERE THE ARRANGEMENT IS ABSENT: the same
    // repair of a parent the grant DOES reach is admitted, so the
    // refusal above is about the endpoint and not about repairs.
    expect(
      refusalOfStart(
        b.root,
        grantAssignment(b, "T-904", {
          resource: "none",
          admission: { kind: "derived", parent: "T-901", evidence: "a failure of T-901", scope: "repair" },
        }),
        "2026-09-14T06:00:02.000Z",
      ),
      "the control: a repair of the endpoint's own work was refused too",
    ).toBeNull();
  } finally {
    b.cleanup();
  }
});

/* ════════════════════════════════════════════════════════════════════
 * T-322 — A SPAWN REFUSED FOR QUOTA IS A RECORDED RETRY INSTANT.
 *
 * These drive the NATIVE path by the verbs, and the shape is the one the
 * loop actually meets: the record is written and the resource reserved,
 * the seat asks its harness to spawn, the provider refuses, and the seat
 * hands the refusal back through the evidence the stop already takes.
 * Nothing here sleeps and nothing here talks to a provider.
 * ════════════════════════════════════════════════════════════════════ */

/**
 * An attempt refused at the spawn: reserved, never bound, and stopped
 * with the provider's own text as the evidence. `RUN-DONE gone` is the
 * honest token for a child that never started, and it is what carries
 * the reconciliation to `ended` — which is the card's "no writer is
 * created or lost by assumption", enforced rather than asserted.
 */
function refusedSpawn(b: Bench, text: string, at = "2026-09-14T12:00:00.000Z") {
  const started = startRun(b.root, {
    assignment: assignment(b),
    at: "2026-09-14T11:59:00.000Z",
    io: io(),
  });
  return stopRun(b.root, {
    attempt: started.record.attempt,
    evidence: `${text}\n${DONE_TOKEN} gone\n`,
    at,
    io: io(),
  });
}

test("A QUOTA REFUSAL IS RECORDED ON THE RUN RECORD WITH ITS NEXT RETRY INSTANT — the provider's own reset where it names one, a capped growing delay where it does not", () => {
  // THE CARD'S FOURTH CRITERION, the record half. The instant is on the
  // record and NOT in a session's memory for one reason: the coordinator
  // that revisits it may be a successor seat that never met the refusal.
  //
  // KILLED BY: a stop that records the refusal and no instant; one that
  // ignores the provider's stated reset and guesses a delay anyway; a
  // delay that does not grow across refusals; a delay that grows past the
  // cap; and a reconciliation skipped, which would leave the resource
  // reserved under a writer nobody established was gone.
  const b = bench("quota-instant");
  try {
    const stated = refusedSpawn(
      b,
      "the provider refused: 429 rate limit exceeded, resets at 2026-09-14T13:30:00Z",
    );
    expect(stated.refusal.kind, "the refusal was not read as a quota refusal").toBe("quota");
    expect(stated.record.retry?.at, "the provider's own stated reset was not used").toBe(
      "2026-09-14T13:30:00.000Z",
    );
    expect(stated.record.retry?.source).toContain("the provider's own stated reset instant");
    // AND THE RECONCILIATION HAPPENED: the reservation is released and
    // the record is terminal, so nothing is holding the lane.
    expect(stated.record.state).toBe("stopped");
    expect(readReservation(b.root, b.lane), "the resource is still reserved after the refusal").toBe(
      null,
    );

    // NO STATED RESET: a capped exponential, and it GROWS. The second
    // refusal is a second attempt for the same work, so the record on
    // disk is what the count is derived from — not a counter in a
    // session.
    const first = refusedSpawn(b, "the provider refused: usage limit reached, try again later");
    expect(first.refusal.kind).toBe("quota");
    // THE COUNT IS DERIVED FROM THE RECORDS ON DISK AND NOT FROM A
    // SESSION, which is why this is the SECOND refusal for this work: the
    // stated-reset one above is still on disk. A counter held in memory
    // would say one here, and a successor seat would then restart the
    // growth from the beginning.
    expect(first.record.retry?.attempts, "the refusal count was not derived from the records").toBe(2);
    const secondB = bench("quota-growth");
    try {
      const a1 = refusedSpawn(secondB, "429 too many requests");
      const a2 = refusedSpawn(secondB, "429 too many requests");
      const a3 = refusedSpawn(secondB, "429 too many requests");
      const delay = (r: { at: string } | null | undefined, at: string) =>
        Date.parse(String(r?.at)) - Date.parse(at);
      const d1 = delay(a1.record.retry, "2026-09-14T12:00:00.000Z");
      const d2 = delay(a2.record.retry, "2026-09-14T12:00:00.000Z");
      const d3 = delay(a3.record.retry, "2026-09-14T12:00:00.000Z");
      expect([d1, d2, d3], "the delay does not grow on each refusal").toEqual([
        60_000, 120_000, 240_000,
      ]);
      expect(a3.record.retry?.attempts).toBe(3);
    } finally {
      secondB.cleanup();
    }
  } finally {
    b.cleanup();
  }
});

test("AN AUTHENTICATION OR CONFIGURATION FAILURE IS NOT A QUOTA REFUSAL — it is recorded, it schedules NO retry, and it parks with a question", () => {
  // THE CARD'S FOURTH CRITERION's discrimination, and the reason it is a
  // separate body: the two arrive wearing the same exit code and the
  // right answer is OPPOSITE. Waiting never resolves a credential, and
  // the fix — a different model, a different account — is a decision this
  // loop does not hold.
  //
  // KILLED BY: a classifier that matches on the exit code or on the word
  // "refused"; one that schedules a retry for an authentication failure;
  // and one that records nothing at all, which would leave the seat with
  // a stopped attempt and no reason.
  const b = bench("auth-refusal");
  try {
    const auth = refusedSpawn(b, "the provider refused: 401 Unauthorized — invalid api key");
    expect(auth.refusal.kind).toBe("authentication");
    expect(auth.record.retry, "an authentication failure scheduled a retry").toBe(null);
    expect(auth.record.refusal?.why).toContain("parks with a question");

    const conf = refusedSpawn(b, "the provider refused: unknown model claude-opus-99");
    expect(conf.refusal.kind).toBe("configuration");
    expect(conf.record.retry, "a configuration failure scheduled a retry").toBe(null);
    expect(conf.record.refusal?.why).toContain("configured permission");

    // THE CONTROL, and it is what makes the two above mean anything: an
    // ordinary stop carries NO refusal and NO retry, so the classifier is
    // not simply labelling every stop.
    const plain = refusedSpawn(b, "the executor finished its turn and stamped the card");
    expect(plain.refusal.kind).toBe("none");
    expect(plain.record.refusal, "an ordinary stop was labelled a provider refusal").toBe(null);
    expect(plain.record.retry).toBe(null);
  } finally {
    b.cleanup();
  }
});

test("THE RECORDED INSTANT SURVIVES THE PROCESS — a fresh read of the records separates what is DUE from what is merely scheduled", () => {
  // THE CARD'S FOURTH CRITERION's whole point: the coordinator REVISITS
  // the instant at its own boundaries, and the coordinator that revisits
  // it may be a successor seat. So the derivation is over the records on
  // disk, read fresh, and never over anything a session carried.
  //
  // KILLED BY: holding the retry in memory; a `dueRetries` that reads the
  // real clock rather than the instant it is handed; and one that calls a
  // future instant due, which is the retry that fires early and burns the
  // window it was waiting for.
  const b = bench("retry-survives");
  try {
    refusedSpawn(b, "429 rate limit exceeded, resets at 2026-09-14T13:30:00Z");
    const fresh = allRecords(b.root);
    expect(fresh.length, "the fixture wrote no record to read back").toBe(1);
    const before = dueRetries(fresh, "2026-09-14T13:00:00.000Z");
    expect(before.due, "a future instant was called due").toEqual([]);
    expect(before.scheduled.map((r: { at: string }) => r.at)).toEqual(["2026-09-14T13:30:00.000Z"]);
    const after = dueRetries(fresh, "2026-09-14T13:31:00.000Z");
    expect(after.due.map((r: { work: string }) => r.work)).toEqual([WORK]);
    expect(after.scheduled).toEqual([]);
    // AND THE RETRY IS A FRESH START RATHER THAN A RESUMED ONE, which is
    // what re-reads the pause, the grant and the shared eligibility at
    // the child-start boundary.
    expect(String(fresh[0]?.retry?.why)).toContain("re-reads the pause, the grant");
  } finally {
    b.cleanup();
  }
});

test("THE REFUSAL PATH NAMES NO MODEL AND NO ACCOUNT — this arm holds no code that could change either", () => {
  // THE CARD'S FOURTH CRITERION's last clause, and it is held by
  // INSPECTION because that is the honest shape for a negative: "models
  // and accounts are never changed without the configured permission" is
  // a claim about what the code CANNOT do, and a body that drove one path
  // would show only that one path does not.
  //
  // KILLED BY: any write to the assignment's model or to a provider
  // account from the refusal path.
  const source = readFileSync(path.join(repoRoot, "tools", "e2e", "scripts", "run-record.mjs"), "utf8");
  const stop = source.slice(source.indexOf("export function stopRun"));
  const body = stop.slice(0, stop.indexOf("\n/* "));
  expect(body, "the refusal path is not in the stop verb any more").toContain("classifyRefusal");
  for (const forbidden of ["assignment.model =", "assignment.harness =", "process.env"]) {
    expect(body, `the refusal path writes ${forbidden}`).not.toContain(forbidden);
  }
});

/* ════════════════════════════════════════════════════════════════════
 * T-320 — THE LAUNCH RECEIPT: REQUESTED BESIDE OBSERVED.
 * ════════════════════════════════════════════════════════════════════ */

test("T-320 C4 — THE RECEIPT NAMES THE REQUESTED MODEL AND EFFORT BESIDE THE OBSERVED MODEL, TOKENS AND SECONDS, and a missing observation is `unknown` and never substituted", () => {
  // THE NATIVE PATH, driven by the verbs — which is the path the receipt
  // exists for: a native child's model, token count and seconds arrive in
  // the harness's own completion notification, and the seat copies them
  // into this operation's evidence.
  //
  // **THE TWO HALVES NEVER FILL IN FOR EACH OTHER**, and that is the whole
  // property. A receipt that copied the requested value into the observed
  // field would agree with itself by construction, and the mismatch it
  // exists to expose could never appear.
  //
  // KILLED BY: a receipt that reads the observed model off the assignment,
  // one that leaves a missing observation blank instead of `unknown`, one
  // that reports `unknown` as a mismatch, and one that reads a token
  // MENTIONED in a sentence as a token.
  const b = bench("receipt");
  try {
    const rec = running(b, { model: "claude-opus-5", effort: "high" });
    // BOUND AND NEVER OBSERVED: every observed field is `unknown`, said
    // out loud rather than left absent.
    const bare = launchReceipt(readRecord(b.root, rec.attempt));
    expect(bare.requested.model, "the requested model is not the assignment's").toBe("claude-opus-5");
    expect(bare.requested.effort, "the requested effort is not the assignment's").toBe("high");
    for (const key of OBSERVED_KEYS) {
      expect(
        (bare.observed as Record<string, string>)[key],
        `an unobserved ${key} is not recorded as ${OBSERVED_UNKNOWN}`,
      ).toBe(OBSERVED_UNKNOWN);
    }
    expect(bare.unknown.length, "the three missing observations were not reported").toBe(OBSERVED_KEYS.length);
    expect(bare.mismatch, "an UNKNOWN observation was reported as a mismatch, which it is not").toEqual([]);

    // THE COMPLETION ARRIVES, and the observed half is read off IT.
    const observed = observeRun(b.root, {
      attempt: rec.attempt,
      evidence: [
        "the harness's completion notification for this task",
        `${OBSERVED_TOKEN} model=claude-opus-5 tokens=262000 seconds=1740`,
        `${DONE_TOKEN} ok`,
      ].join("\n"),
      at: "2026-09-12T00:00:30.000Z",
      io: io(),
    }).record;
    const receipt = launchReceipt(observed);
    expect(receipt.observed.model, "the observed model was not read off the completion").toBe("claude-opus-5");
    expect(receipt.observed.tokens, "the observed token count was not read off the completion").toBe("262000");
    expect(receipt.observed.seconds, "the observed seconds were not read off the completion").toBe("1740");
    expect(receipt.observed.source, "the receipt does not say where the observation came from").toContain("completion");
    expect(receipt.unknown, "an observation that arrived was still reported unknown").toEqual([]);
    expect(receipt.mismatch, "a matching model was reported as a mismatch").toEqual([]);
    // REQUESTED AND OBSERVED ARE SEPARATE FIELDS ON THE RECORD ITSELF.
    const onDisk = JSON.parse(readFileSync(recordPath(b.root, rec.attempt), "utf8"));
    expect(onDisk.assignment.model, "the requested model left the record").toBe("claude-opus-5");
    expect(onDisk.execution.observed.model, "the observed model is not a field of its own").toBe("claude-opus-5");

    // A PARTIAL COMPLETION: what arrived is recorded and what did not is
    // `unknown`, rather than the whole observation being thrown away.
    const partial = bench("receipt-partial");
    try {
      const other = running(partial);
      const seen = observeRun(partial.root, {
        attempt: other.attempt,
        evidence: `${OBSERVED_TOKEN} model=claude-opus-5\n${DONE_TOKEN} ok`,
        at: "2026-09-12T00:00:30.000Z",
        io: io(),
      }).record;
      const r = launchReceipt(seen);
      expect(r.observed.model, "a partial completion's model was discarded").toBe("claude-opus-5");
      expect(r.observed.tokens, "a token count nobody reported was invented").toBe(OBSERVED_UNKNOWN);
      expect(r.observed.seconds, "a duration nobody reported was invented").toBe(OBSERVED_UNKNOWN);
      expect(r.unknown.length, "the two missing figures were not both reported").toBe(2);
    } finally {
      partial.cleanup();
    }

    // AND A TOKEN MENTIONED IN A SENTENCE IS NOT A TOKEN — the same
    // line-initial rule the other three tokens are under, and for the same
    // reason: the arm must not read its own instructions back as a child's
    // report.
    const mentioned = bench("receipt-mentioned");
    try {
      const other = running(mentioned);
      const seen = observeRun(mentioned.root, {
        attempt: other.attempt,
        evidence: `write a line reading ${OBSERVED_TOKEN} model=some-other-model when you finish`,
        at: "2026-09-12T00:00:30.000Z",
        io: io(),
      }).record;
      expect(
        launchReceipt(seen).observed.model,
        "a sentence MENTIONING the token was read as an observation",
      ).toBe(OBSERVED_UNKNOWN);
    } finally {
      mentioned.cleanup();
    }
  } finally {
    b.cleanup();
  }
});

test("T-320 C4 — A COMPLETION WHOSE OBSERVED MODEL DIFFERS FROM THE REQUESTED ONE IS REPORTED AS A MISMATCH, by name", () => {
  // THE PLANTED COMPLETION — and it is the body that proves the receipt is
  // not a forgery. A receipt that copied the requested value into the
  // observed field would pass every assertion in the body above; only a
  // completion that says something DIFFERENT can tell the two apart.
  //
  // KILLED BY: a receipt that fills the observed half from the assignment,
  // one that reports a mismatch without naming either value, and one that
  // reads `unknown` as a mismatch.
  const b = bench("receipt-mismatch");
  try {
    const rec = running(b, { model: "claude-opus-5" });
    const seen = observeRun(b.root, {
      attempt: rec.attempt,
      evidence: [
        "the harness's completion notification for this task",
        `${OBSERVED_TOKEN} model=a-cheaper-model tokens=12000 seconds=90`,
        `${DONE_TOKEN} ok`,
      ].join("\n"),
      at: "2026-09-12T00:00:30.000Z",
      io: io(),
    }).record;
    const receipt = launchReceipt(seen);
    expect(receipt.requested.model, "the requested model moved").toBe("claude-opus-5");
    expect(receipt.observed.model, "the observed model was overwritten by the requested one").toBe("a-cheaper-model");
    expect(receipt.mismatch.length, "a completion naming another model produced no mismatch").toBe(1);
    expect(receipt.mismatch[0], "the mismatch does not name the model that was requested").toContain("claude-opus-5");
    expect(receipt.mismatch[0], "the mismatch does not name the model that was observed").toContain("a-cheaper-model");
    // AND THE ARM PRINTS IT, so a seat reading the run's own output meets
    // it rather than having to ask for a receipt.
    const printed = runRecs(
      { at: "2026-09-12T00:00:31.000Z", host: "a-host", root: b.root },
      "observe",
      seen,
      [],
    )
      .map((r) => String((r as { text?: string }).text ?? ""))
      .join("\n");
    expect(printed, "the run report does not carry the receipt's requested half").toContain("receipt requested:");
    expect(printed, "the run report does not carry the receipt's observed half").toContain("receipt observed:");
    expect(printed, "the run report does not announce the mismatch").toContain("receipt MISMATCH:");
  } finally {
    b.cleanup();
  }
});

test("T-320 C6 — THE FIVE MEASUREMENTS COME OFF THE RECORD'S OWN STAMPED INSTANTS: the dispatch's two ride in on the assignment, the candidate is stamped at the outcome, and the seat's three arrive through collect", () => {
  // THE NATIVE PATH, driven by the verbs. What is under test is that a
  // demonstration's figures are TRANSCRIBED from a record rather than
  // recalled: every instant is stamped by whoever holds it, and the
  // measurement block is derived from the record and printed by the run
  // report.
  //
  // KILLED BY: a record that drops the assignment's instants, one that
  // stamps the candidate somewhere other than the outcome, a collect verb
  // that ignores the dial, a dial that silently keeps a half-read pair,
  // and a report that prints the block for an attempt with nothing to
  // measure.
  const b = bench("instants");
  try {
    // ── THE DISPATCH'S TWO, CARRIED IN ON THE ASSIGNMENT ─────────────
    const started = startRun(b.root, {
      assignment: assignment(b, {
        instants: { requested: "2026-09-12T00:00:00.000Z", cut: "2026-09-12T00:00:40.000Z" },
      }),
      at: "2026-09-12T00:00:45.000Z",
      io: io(),
    });
    expect(started.record.instants.requested, "the outcome sentence's instant did not reach the record").toBe(
      "2026-09-12T00:00:00.000Z",
    );
    expect(started.record.instants.cut, "the lane cut's instant did not reach the record").toBe("2026-09-12T00:00:40.000Z");
    expect(started.record.instants.started, "the arm's own start instant was not stamped").toBe("2026-09-12T00:00:45.000Z");
    // AN UNREADABLE INSTANT IS DROPPED RATHER THAN KEPT: a measurement
    // taken from a date nothing can parse is a figure with no meaning.
    expect(readInstants({ good: "2026-09-12T00:00:00.000Z", bad: "last tuesday", empty: "" }), "an unreadable instant was kept").toEqual({
      good: "2026-09-12T00:00:00.000Z",
    });

    // ── THE CANDIDATE, STAMPED WHERE THE ATTEMPT REACHED ITS OUTCOME ──
    bindRun(b.root, { attempt: started.record.attempt, harnessId: "task-1", at: "2026-09-12T00:00:46.000Z", io: io() });
    const done = observeRun(b.root, {
      attempt: started.record.attempt,
      evidence: `${DONE_TOKEN} ok`,
      at: "2026-09-12T00:04:00.000Z",
      io: io(),
    }).record;
    expect(done.state, "the attempt did not reach a terminal state, so no candidate instant is owed").toBe("finished");
    expect(done.instants.candidate, "the candidate instant was not stamped at the outcome").toBe("2026-09-12T00:04:00.000Z");
    expect(done.instants.candidate, "the candidate instant and the outcome instant disagree").toBe(done.outcome?.at);

    // ── THE SEAT'S THREE, THROUGH THE COLLECT VERB ───────────────────
    const collected = collectRun(b.root, {
      attempt: started.record.attempt,
      usage: "262K tokens",
      instants: {
        checked: "2026-09-12T00:12:00.000Z",
        merged: "2026-09-12T00:15:00.000Z",
        pushed: "2026-09-12T00:15:30.000Z",
      },
      at: "2026-09-12T00:16:00.000Z",
      io: io(),
    }).record;
    // AND THE MEASUREMENTS ARE DIFFERENCES OF EXACTLY THOSE INSTANTS.
    const m = expressMeasurements(expressInstants(collected));
    const rows = new Map(m.rows.map((r) => [r.id, r]));
    expect(rows.get("overhead")?.seconds, "the overhead is not the difference the record carries").toBe(40);
    expect(rows.get("executor")?.seconds, "the executor time is not the difference the record carries").toBe(200);
    expect(rows.get("check")?.seconds, "the check time is not the difference the record carries").toBe(480);
    expect(rows.get("publication")?.seconds, "the publication time is not the difference the record carries").toBe(30);
    expect(rows.get("request-to-delivery")?.seconds, "the total is not the difference the record carries").toBe(930);
    expect(m.unknown, "an instant was reported unknown though the record carries all six").toEqual([]);

    // ── AND THE RUN REPORT PRINTS THE BLOCK, so the notes are copied out
    //    of a command's output rather than remembered.
    const printed = runRecs({ at: "2026-09-12T00:16:01.000Z", host: "a-host", root: b.root }, "collect", collected, [])
      .map((r) => String((r as { text?: string }).text ?? ""))
      .join("\n");
    expect(printed, "the run report does not print the measurement block").toContain("measurement overhead:");
    expect(printed, "the run report does not print the target verdict").toContain("measurement verdict:");
    expect(printed, "the run report does not name the instants the block was taken from").toContain("stamped instants");
  } finally {
    b.cleanup();
  }
});

test("T-320 C6 — AN ATTEMPT WITH NOTHING TO MEASURE PRINTS NO MEASUREMENT BLOCK, and a half-read instant dial is refused rather than kept", () => {
  // THE POSITIVE CONTROL FOR THE BLOCK ABOVE, and the dial's own refusal.
  // Five unknown rows under every ordinary run is noise, and noise is how
  // a block nobody reads is made; a dial that kept the half it understood
  // is a measurement the seat believes it recorded and did not.
  //
  // KILLED BY: a report that prints the block unconditionally, and a dial
  // that drops what it cannot parse.
  const b = bench("instants-none");
  try {
    const rec = running(b);
    const printed = runRecs({ at: "2026-09-12T00:00:03.000Z", host: "a-host", root: b.root }, "observe", rec, [])
      .map((r) => String((r as { text?: string }).text ?? ""))
      .join("\n");
    expect(printed, "an attempt with no express instants printed a measurement block").not.toContain("measurement verdict:");
    // AND THE CONTROL: the same report over an attempt that HAS them.
    // The attempt is taken to a terminal state first, because a collect
    // answers for a terminal attempt and this body is about the BLOCK
    // rather than about that rule.
    observeRun(b.root, {
      attempt: rec.attempt,
      evidence: `${DONE_TOKEN} ok`,
      at: "2026-09-12T00:00:03.500Z",
      io: io(),
    });
    const withOne = collectRun(b.root, {
      attempt: rec.attempt,
      instants: { requested: "2026-09-12T00:00:00.000Z" },
      at: "2026-09-12T00:00:04.000Z",
      io: io(),
    }).record;
    const after = runRecs({ at: "2026-09-12T00:00:05.000Z", host: "a-host", root: b.root }, "collect", withOne, [])
      .map((r) => String((r as { text?: string }).text ?? ""))
      .join("\n");
    expect(after, "the block is not printed even when the record carries an instant").toContain("measurement verdict:");

    // THE DIAL REFUSES WHAT IT CANNOT READ, BY NAME.
    for (const bad of ["checked", "checked=", "checked=last tuesday", "=2026-09-12T00:00:00.000Z"]) {
      let code = "";
      try {
        parseInstantDial(bad);
      } catch (err) {
        if (!(err instanceof RunRecordFinding)) throw err;
        code = err.code;
      }
      expect(code, `${JSON.stringify(bad)} was accepted as an instant pair`).toBe("RUN_INSTANT");
    }
    expect(
      parseInstantDial("checked=2026-09-12T00:12:00.000Z,merged=2026-09-12T00:15:00.000Z"),
      "the well-formed dial was refused too, so the four refusals above prove nothing",
    ).toEqual({ checked: "2026-09-12T00:12:00.000Z", merged: "2026-09-12T00:15:00.000Z" });
  } finally {
    b.cleanup();
  }
});

test("T-315-s1 — native bind identity and the exact continuation ref survive the shared run-plan parser", () => {
  // KILLED BY: dropping any side of the callback/probe tuple, or accepting
  // --ref syntactically while discarding it before the independent gate.
  expect(
    runPlan({
      run: "bind",
      attempt: "T-315-s1-a1",
      session: "agent-315",
      "task-name": "/root/native_t315s1_sol_executor",
      "reported-thread-id": "agent-315",
      "start-turn-id": "turn-315",
    }),
  ).toEqual(
    expect.objectContaining({
      harnessId: "agent-315",
      taskName: "/root/native_t315s1_sol_executor",
      reportedThreadId: "agent-315",
      startTurnId: "turn-315",
    }),
  );
  expect(
    runPlan({
      run: "continue",
      attempt: "T-315-s1-a1",
      ref: "0123456789abcdef0123456789abcdef01234567",
    }),
  ).toEqual(expect.objectContaining({ ref: "0123456789abcdef0123456789abcdef01234567" }));
});
