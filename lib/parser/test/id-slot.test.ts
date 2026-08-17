import { describe, expect, it } from 'vitest';
import { aliasedIdSlots, idSlotKey } from '../src/id-slot.js';

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
