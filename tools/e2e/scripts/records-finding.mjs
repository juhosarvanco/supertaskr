/** Shared parser-free record error identity; importing it performs no capture. */
export class RecordReaderFinding extends Error {
  /** @param {string} code @param {string} detail */
  constructor(code, detail) { super(`${code}: ${detail}`); this.name = "RecordReaderFinding"; this.code = code; }
}
