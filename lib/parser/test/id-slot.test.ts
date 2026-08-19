import { describe, expect, it } from 'vitest';
import {
  aliasedIdSlots,
  compareDigitRuns,
  idSlotIndex,
  idSlotKey,
  nearMissClause,
  slotNearMisses,
} from '../src/id-slot.js';

/**
 * T-053 — the numeric-slot grouping, lifted out of parseComponentSet so
 * all three id spaces share ONE answer to "is this the same slot spelled
 * twice". Tested at LITERAL keys rather than by comparing two calls of
 * the function to each other: `expect(key(a)).toEqual(key(b))` holds for
 * a function that returns a constant, so it proves nothing about
 * aliasing. Every expectation below names the string it wants.
 */

describe('idSlotKey — leading zeros stripped in place, structure preserved', () => {
  it('canonicalizes each id space to a literal key', () => {
    const table: [string, string][] = [
      // components (T-030's original space)
      ['C-05', 'C-5'],
      ['C-005', 'C-5'],
      ['C-0005', 'C-5'],
      ['C-50', 'C-50'],
      ['C-500', 'C-500'],
      // backbone features
      ['F-1', 'F-1'],
      ['F-01', 'F-1'],
      ['F-10', 'F-10'],
      // tasks
      ['T-01', 'T-1'],
      ['T-001', 'T-1'],
      ['T-016', 'T-16'],
      // an all-zero id keeps one zero: T-0 / T-00 / T-000 are one slot
      ['T-0', 'T-0'],
      ['T-00', 'T-0'],
      ['T-000', 'T-0'],
      // no digits at all: its own slot, no special case needed
      ['T-banana', 'T-banana'],
    ];
    for (const [id, key] of table) expect(idSlotKey(id)).toBe(key);
  });

  it('canonicalizes the -sN suffix SEPARATELY, so a suggestion is never its parent', () => {
    // The suffix is part of task identity. Its digits must alias like any
    // others, while the `-s` keeps parent and suggestion apart — a key
    // that reads only the first number merges T-016-s2 into T-016.
    expect(idSlotKey('T-01-s1')).toBe('T-1-s1');
    expect(idSlotKey('T-001-s1')).toBe('T-1-s1');
    expect(idSlotKey('T-01-s01')).toBe('T-1-s1');
    expect(idSlotKey('T-016-s02')).toBe('T-16-s2');
    // …and the parent's key is a DIFFERENT literal string.
    expect(idSlotKey('T-01')).toBe('T-1');
    expect(idSlotKey('T-01-s1')).not.toBe(idSlotKey('T-01'));
  });

  it('is TEXTUAL, never Number(): ids past 2^53 keep distinct keys', () => {
    // Number('9007199254740993') === Number('9007199254740992') is true,
    // so any key computed through Number() fuses these two into one slot.
    expect(Number('9007199254740993')).toBe(Number('9007199254740992'));
    expect(idSlotKey('T-9007199254740993')).toBe('T-9007199254740993');
    expect(idSlotKey('T-9007199254740992')).toBe('T-9007199254740992');
    // A padded spelling of the huge id still lands on it.
    expect(idSlotKey('T-0009007199254740993')).toBe('T-9007199254740993');
    // Same in the suffix, where the digits are equally unbounded.
    expect(idSlotKey('T-1-s9007199254740993')).toBe('T-1-s9007199254740993');
    expect(idSlotKey('T-1-s9007199254740992')).toBe('T-1-s9007199254740992');
    // And past Number's range entirely, where Number() gives Infinity.
    const huge = '1'.repeat(400);
    expect(Number(huge)).toBe(Number(`2${'1'.repeat(399)}`));
    expect(idSlotKey(`T-${huge}`)).toBe(`T-${huge}`);
    expect(idSlotKey(`T-00${huge}`)).toBe(`T-${huge}`);
  });
});

describe('aliasedIdSlots — only the slots with two or more spellings', () => {
  it('returns each aliased slot once, sorted, in first-seen slot order', () => {
    expect(aliasedIdSlots(['T-02', 'T-01', 'T-001', 'T-0002', 'T-03'])).toEqual([
      ['T-0002', 'T-02'],
      ['T-001', 'T-01'],
    ]);
  });

  it('a slot spelled once is not an alias, however padded the neighbours', () => {
    expect(aliasedIdSlots(['C-05', 'C-50', 'C-500', 'C-0505'])).toEqual([]);
  });

  it('three spellings of one slot are ONE group, not three pairs', () => {
    expect(aliasedIdSlots(['T-01', 'T-001', 'T-0001'])).toEqual([['T-0001', 'T-001', 'T-01']]);
  });

  it('ids are a SET: an exact repeat is duplicate-id business, never an alias', () => {
    expect(aliasedIdSlots(['T-01', 'T-01', 'T-01'])).toEqual([]);
    expect(aliasedIdSlots(['T-01', 'T-01', 'T-001'])).toEqual([['T-001', 'T-01']]);
  });

  it('parent and suggestion never share a slot; suggestion spellings do', () => {
    expect(aliasedIdSlots(['T-01', 'T-01-s1'])).toEqual([]);
    expect(aliasedIdSlots(['T-01', 'T-01-s1', 'T-001-s1', 'T-01-s01'])).toEqual([
      ['T-001-s1', 'T-01-s01', 'T-01-s1'],
    ]);
  });

  it('honours a caller comparator (the component space passes its own)', () => {
    const reverse = (a: string, b: string): number => (a < b ? 1 : a > b ? -1 : 0);
    expect(aliasedIdSlots(['C-05', 'C-005'], reverse)).toEqual([['C-05', 'C-005']]);
    expect(aliasedIdSlots(['C-05', 'C-005'])).toEqual([['C-005', 'C-05']]);
  });

  it('ids with no digits never group together', () => {
    expect(aliasedIdSlots(['alpha', 'beta'])).toEqual([]);
    expect(aliasedIdSlots([])).toEqual([]);
  });
});

describe('compareDigitRuns — numeric order for a digit run of any length (T-076)', () => {
  it('orders by canonical length first, then lexicographically', () => {
    expect(compareDigitRuns('9', '10')).toBeLessThan(0);
    expect(compareDigitRuns('10', '9')).toBeGreaterThan(0);
    expect(compareDigitRuns('08', '9')).toBeLessThan(0);
    expect(compareDigitRuns('100', '99')).toBeGreaterThan(0);
    expect(compareDigitRuns('42', '42')).toBe(0);
  });

  it('reads leading zeros as decoration, exactly as idSlotKey does', () => {
    // The shared strip is the point: a comparator and a slot key that
    // disagree about what the digits of an id ARE is the defect this
    // module exists to prevent, one function away from where it lived.
    expect(compareDigitRuns('05', '5')).toBe(0);
    expect(compareDigitRuns('0005', '5')).toBe(0);
    expect(compareDigitRuns('000', '0')).toBe(0);
    expect(compareDigitRuns('0005', '5')).toBe(compareDigitRuns('C-0005'.slice(2), '5'));
    expect(idSlotKey('C-0005')).toBe(idSlotKey('C-5'));
  });

  it('is EXACT past 2^53, where Number() fuses neighbours', () => {
    expect(Number('9007199254740993')).toBe(Number('9007199254740992'));
    expect(compareDigitRuns('9007199254740993', '9007199254740992')).toBeGreaterThan(0);
    expect(compareDigitRuns('9007199254740992', '9007199254740993')).toBeLessThan(0);
    // Fused across a length boundary, where the sign was actually WRONG:
    // 17 nines is smaller than 1e17, and Number() called them equal.
    expect(Number('9'.repeat(17))).toBe(Number(`1${'0'.repeat(17)}`));
    expect(compareDigitRuns('9'.repeat(17), `1${'0'.repeat(17)}`)).toBeLessThan(0);
  });

  it('is TOTAL past ~309 digits, where the subtraction was NaN', () => {
    const a = '1'.repeat(400);
    const b = '2'.repeat(400);
    expect(Number(a)).toBe(Infinity);
    expect(Number(b)).toBe(Infinity);
    expect(Number(a) - Number(b)).toBeNaN();
    expect(compareDigitRuns(a, b)).toBeLessThan(0);
    expect(compareDigitRuns(b, a)).toBeGreaterThan(0);
    expect(compareDigitRuns(a, a)).toBe(0);
    // Padding a 400-digit id does not change which slot it is.
    expect(compareDigitRuns(`00${a}`, a)).toBe(0);
  });

  it('sorts a huge set to one answer whatever order it arrives in', () => {
    const runs = ['3'.repeat(400), '1'.repeat(400), '2'.repeat(400), '1'.repeat(401)];
    const sorted = [...runs].sort(compareDigitRuns);
    expect(sorted).toEqual(['1'.repeat(400), '2'.repeat(400), '3'.repeat(400), '1'.repeat(401)]);
    expect([...runs].reverse().sort(compareDigitRuns)).toEqual(sorted);
  });
});

describe('idSlotIndex — the one grouping pass', () => {
  it('maps each slot to its distinct spellings, both orders first-seen', () => {
    const index = idSlotIndex(['T-02', 'T-01', 'T-001', 'T-0002', 'T-03', 'T-01']);
    expect([...index.keys()]).toEqual(['T-2', 'T-1', 'T-3']);
    expect(index.get('T-2')).toEqual(['T-02', 'T-0002']);
    expect(index.get('T-1')).toEqual(['T-01', 'T-001']);
    expect(index.get('T-3')).toEqual(['T-03']);
  });

  it('ADR-009: a hostile id is an ordinary slot, never inherited state', () => {
    const index = idSlotIndex(['__proto__', 'constructor', 'T-01']);
    expect(index.get('__proto__')).toEqual(['__proto__']);
    expect(index.get('constructor')).toEqual(['constructor']);
    // A plain object would have answered `toString` out of its prototype.
    expect(index.get('toString')).toBeUndefined();
    expect(index.has('toString')).toBe(false);
  });
});

describe('slotNearMisses — the declared spellings a reference nearly matched', () => {
  const declared = idSlotIndex(['T-001', 'T-002', 'T-016-s2']);

  it('names a padding variant of a declared id', () => {
    expect(slotNearMisses('T-01', declared)).toEqual(['T-001']);
    expect(slotNearMisses('T-0001', declared)).toEqual(['T-001']);
    expect(slotNearMisses('T-16-s02', declared)).toEqual(['T-016-s2']);
  });

  it('is empty for a reference that is simply absent', () => {
    expect(slotNearMisses('T-777', declared)).toEqual([]);
    expect(slotNearMisses('T-16', declared)).toEqual([]); // the parent is NOT the suggestion
    expect(slotNearMisses('__proto__', declared)).toEqual([]);
    expect(slotNearMisses('toString', declared)).toEqual([]);
  });

  it('excludes the reference itself, so a declared id is never its own near miss', () => {
    expect(slotNearMisses('T-001', declared)).toEqual([]);
    expect(slotNearMisses('T-001', idSlotIndex(['T-001', 'T-01']))).toEqual(['T-01']);
  });

  it('names every spelling when the declared space is itself aliased', () => {
    expect(slotNearMisses('T-0001', idSlotIndex(['T-01', 'T-001']))).toEqual(['T-01', 'T-001']);
  });
});

describe('nearMissClause — the one sentence fragment, in one place', () => {
  it('is empty for no near miss, so a call site interpolates it unconditionally', () => {
    expect(nearMissClause([])).toBe('');
  });

  it('reads singular for one and plural for several, ids in order', () => {
    expect(nearMissClause(['T-001'])).toBe(
      " — 'T-001' is declared and differs only in zero padding",
    );
    expect(nearMissClause(['T-01', 'T-001'])).toBe(
      " — 'T-01', 'T-001' are declared and differ only in zero padding",
    );
  });
});
