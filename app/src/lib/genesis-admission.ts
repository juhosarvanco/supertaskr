import type { GenesisEvent } from "./agent-store";

/** Native-issued selection numbers correlate a view; they grant no paths. */
export interface GenesisContextToken { selectionSequence: number; contextSequence: number }
export interface GenesisIdentity {
  activation: number; token: string; sessionId: string; originDigest: string; initiatingAttempt: number;
}
export interface GenesisView { context: GenesisContextToken; identity: GenesisIdentity | null; eventContext: GenesisContextToken | null }
export interface GenesisReply<T> extends GenesisContextToken {
  attempt: number; seq: number; identity: GenesisIdentity | null; result: T;
}
export interface ScopedGenesisEvent extends GenesisContextToken {
  attempt: number; identity: GenesisIdentity; event: GenesisEvent;
}
export const GENESIS_EARLY_EVENT_LIMIT = 128;
export const GENESIS_EARLY_BYTE_LIMIT = 1024 * 1024;
const finite = (n: unknown): n is number => Number.isSafeInteger(n) && (n as number) > 0;
export function sameGenesisContext(a: GenesisContextToken | null, b: GenesisContextToken | null): boolean {
  return a !== null && b !== null && a.selectionSequence === b.selectionSequence && a.contextSequence === b.contextSequence;
}
export function sameGenesisIdentity(a: GenesisIdentity | null, b: GenesisIdentity | null): boolean {
  return a !== null && b !== null && a.activation === b.activation && a.token === b.token && a.sessionId === b.sessionId &&
    a.originDigest === b.originDigest && a.initiatingAttempt === b.initiatingAttempt;
}
function validIdentity(identity: GenesisIdentity): boolean {
  return identity !== null && typeof identity === "object" && finite(identity.activation) && finite(identity.initiatingAttempt) &&
    typeof identity.token === "string" && identity.token.length > 0 && identity.token.length <= 256 &&
    /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(identity.sessionId) && /^sha256:[0-9a-f]{64}$/.test(identity.originDigest);
}
interface Pending {
  attempt: number; expectedIdentity: GenesisIdentity | null; events: ScopedGenesisEvent[]; bytes: number; unknown: boolean;
}
export interface GenesisAdmissionResult { admitted: boolean; events: GenesisEvent[]; reconcile: boolean }
const refused = (): GenesisAdmissionResult => ({ admitted: false, events: [], reconcile: false });

/** This gate runs before the existing event reducer and its sequence/clock.
 * Early events are bounded data until the command confirms native activation.
 * A missing reply or overflow needs a scoped status/history read, never an
 * invented Started event or a new operation targeting the latest selection.
 */
export class GenesisAdmission {
  context: GenesisContextToken | null = null;
  identity: GenesisIdentity | null = null;
  eventAttempt: number | null = null;
  eventContext: GenesisContextToken | null = null;
  private pending: Pending | null = null;
  select(context: GenesisContextToken | null): boolean {
    if (context === null && this.context === null || sameGenesisContext(this.context, context)) return false;
    this.context = context === null ? null : { ...context };
    this.identity = null; this.eventAttempt = null; this.eventContext = null; this.pending = null;
    return true;
  }
  begin(attempt: number, expectedIdentity: GenesisIdentity | null = null): boolean {
    if (!this.context || !finite(attempt) || this.pending || expectedIdentity && !sameGenesisIdentity(expectedIdentity, this.identity)) return false;
    this.pending = { attempt, expectedIdentity, events: [], bytes: 0, unknown: false };
    return true;
  }
  uncertain(attempt: number): void {
    if (this.pending?.attempt === attempt) { this.pending.unknown = true; this.pending.events = []; this.pending.bytes = 0; }
  }
  private envelope(value: GenesisContextToken & { attempt: number }): boolean {
    return value !== null && typeof value === "object" && finite(value.attempt) && sameGenesisContext(this.context, value);
  }
  event(value: ScopedGenesisEvent): GenesisAdmissionResult {
    const source = this.pending && !this.pending.expectedIdentity ? this.context : this.eventContext ?? this.context;
    if (!value || !finite(value.attempt) || !sameGenesisContext(source, value) || !validIdentity(value.identity) || !value.event || !finite(value.event.seq)) return refused();
    if (this.pending?.attempt === value.attempt) {
      if (this.pending.unknown) return { ...refused(), reconcile: true };
      // UTF-8 bytes, not UTF-16 units, bound the retained wire payload.
      const bytes = new TextEncoder().encode(JSON.stringify(value)).byteLength;
      if (this.pending.events.length >= GENESIS_EARLY_EVENT_LIMIT || this.pending.bytes + bytes > GENESIS_EARLY_BYTE_LIMIT) {
        this.uncertain(value.attempt); return { ...refused(), reconcile: true };
      }
      this.pending.events.push(value); this.pending.bytes += bytes;
      return refused();
    }
    return this.pending || value.attempt !== this.eventAttempt || !sameGenesisIdentity(this.identity, value.identity)
      ? refused() : { admitted: true, events: [value.event], reconcile: false };
  }
  complete<T>(value: GenesisReply<T>, attempt: number): GenesisAdmissionResult {
    if (!this.envelope(value) || value.attempt !== attempt || this.pending?.attempt !== attempt || !finite(value.seq)) return { ...refused(), reconcile: this.pending?.attempt === attempt };
    if (value.identity !== null && (!validIdentity(value.identity) || this.pending.expectedIdentity && !sameGenesisIdentity(this.pending.expectedIdentity, value.identity))) return { ...refused(), reconcile: true };
    const pending = this.pending;
    // A lost event buffer cannot be reconstructed from a command outcome.
    if (pending.unknown) return { ...refused(), reconcile: true };
    this.pending = null;
    if (value.identity) { this.identity = { ...value.identity }; this.eventAttempt = attempt; if (!pending.expectedIdentity) this.eventContext = { selectionSequence:value.selectionSequence, contextSequence:value.contextSequence }; }
    else if (!pending.expectedIdentity) { this.identity = null; this.eventAttempt = null; this.eventContext = null; }
    return { admitted: true, reconcile: false, events: value.identity === null ? [] : pending.events
      .filter((event) => sameGenesisIdentity(event.identity, value.identity)).map((event) => event.event).sort((a, b) => a.seq - b.seq) };
  }
  status<T>(value: GenesisReply<T>, eventAttempt: number | null, eventContext: GenesisContextToken | null = value.identity ? value : null): GenesisAdmissionResult {
    if (!this.envelope(value) || !finite(value.seq) || value.identity !== null && (!validIdentity(value.identity) || !finite(eventAttempt) || !eventContext || !finite(eventContext.selectionSequence) || !finite(eventContext.contextSequence))) return refused();
    const pending = this.pending;
    if (pending && (eventAttempt !== pending.attempt || value.identity === null || pending.expectedIdentity && !sameGenesisIdentity(pending.expectedIdentity, value.identity))) {
      this.pending = null; this.identity = value.identity === null ? null : { ...value.identity }; this.eventAttempt = eventAttempt; this.eventContext = eventContext;
      return { admitted: true, events: [], reconcile: true };
    }
    const lost = pending?.unknown ?? false;
    this.pending = null; this.identity = value.identity === null ? null : { ...value.identity }; this.eventAttempt = eventAttempt; this.eventContext = eventContext;
    return { admitted: true, events: pending && !lost ? pending.events.filter((event) => sameGenesisIdentity(event.identity, value.identity)).map((event) => event.event).sort((a,b) => a.seq-b.seq) : [], reconcile: lost };
  }
  get awaiting(): boolean { return this.pending !== null; }
}
