import { symlinkSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { captureRawCommittedInputs } from "../scripts/records.mjs";
import { privateRecordFixture, putPrivate, commitPrivate, sha } from "./private-record-fixture";

test("batch committed capture retains exact empty BOM Unicode multiline and duplicate object bytes", () => {
  const f = privateRecordFixture();
  try {
    const contents = [Buffer.alloc(0), Buffer.from("\ufeff# BOM\n\nText\n"), Buffer.from("αβ\nsecond line\n\0end\n")];
    const files = contents.map((bytes, at) => { const file = `docs/rooms/bytes-${at}.md`; putPrivate(f.records, file, bytes); return file; });
    putPrivate(f.records, "docs/rooms/duplicate.md", contents[2]!);
    f.options.recordsRevision = commitPrivate(f.records);
    const capture = captureRawCommittedInputs(f.options), selected = [...files, "docs/rooms/duplicate.md", files[0]!];
    const batch = capture.readMany("records", selected);
    expect(batch).toHaveLength(selected.length); expect(Object.isFrozen(batch)).toBe(true);
    for (let at = 0; at < selected.length; at++) {
      const one = capture.read("records", selected[at]!); expect(batch[at]?.bytes).toEqual(one.bytes);
      expect(batch[at]?.content).toBe(one.content); expect(batch[at]?.blobId).toBe(one.blobId); expect(batch[at]?.path).toBe(selected[at]);
    }
    batch[2]?.bytes.fill(0); expect(batch[2]?.bytes).toEqual(contents[2]); expect(capture.readMany("records", [])).toEqual([]);
  } finally { f.cleanup(); }
});

test("batch capture preserves named missing entry nonregular and invalid UTF8 refusals without fallback", () => {
  const f = privateRecordFixture();
  try {
    putPrivate(f.records, "docs/rooms/invalid.md", Buffer.from([0xff, 0x0a]));
    symlinkSync("note.md", path.join(f.records, "docs/rooms/link.md")); f.options.recordsRevision = commitPrivate(f.records);
    const capture = captureRawCommittedInputs(f.options);
    expect(() => capture.readMany("records", ["docs/rooms/missing.md"])).toThrow(/records-input-missing/);
    expect(() => capture.readMany("records", ["docs/rooms/link.md"])).toThrow(/records-entry-not-regular/);
    expect(() => capture.readMany("records", ["docs/rooms/invalid.md"])).toThrow(/records-encoding-invalid/);
    expect(() => capture.readMany("other" as any, [])).toThrow(/records-input-role-invalid/);
  } finally { f.cleanup(); }
});

test("batch capture reads a corpus above sixteen megabytes without omitting repeated blobs or newline content", () => {
  test.setTimeout(60000);
  const f = privateRecordFixture();
  try {
    const bytes = Buffer.from("abcdef\n".repeat(150000)), files: string[] = [];
    for (let at = 0; at < 24; at++) { const file = `docs/reference/large-${at}.md`; putPrivate(f.records, file, bytes); files.push(file); }
    f.options.recordsRevision = commitPrivate(f.records);
    const batch = captureRawCommittedInputs(f.options).readMany("records", files);
    expect(batch).toHaveLength(24); expect(batch.reduce((total, entry) => total + entry.bytes.length, 0)).toBe(bytes.length * 24);
    expect(bytes.length * 24).toBeGreaterThan(16 * 1024 * 1024);
    for (const entry of batch) expect(sha(entry.bytes)).toBe(sha(bytes));
  } finally { f.cleanup(); }
});
