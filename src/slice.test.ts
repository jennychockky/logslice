import { sliceHead, sliceTail, sliceRange, sliceEntries } from './slice';
import { LogEntry } from './parser';

function makeEntries(count: number): LogEntry[] {
  return Array.from({ length: count }, (_, i) => ({
    timestamp: `2024-01-01T00:00:0${i}Z`,
    level: 'info',
    message: `msg ${i}`,
    raw: `{"message":"msg ${i}"}`,
  }));
}

describe('sliceHead', () => {
  it('returns the first n entries', () => {
    const entries = makeEntries(5);
    expect(sliceHead(entries, 3).map((e) => e.message)).toEqual(['msg 0', 'msg 1', 'msg 2']);
  });

  it('returns empty array when n is 0', () => {
    expect(sliceHead(makeEntries(5), 0)).toHaveLength(0);
  });

  it('returns all entries when n exceeds length', () => {
    expect(sliceHead(makeEntries(3), 10)).toHaveLength(3);
  });
});

describe('sliceTail', () => {
  it('returns the last n entries', () => {
    const entries = makeEntries(5);
    expect(sliceTail(entries, 2).map((e) => e.message)).toEqual(['msg 3', 'msg 4']);
  });

  it('returns empty array when n is 0', () => {
    expect(sliceTail(makeEntries(5), 0)).toHaveLength(0);
  });

  it('returns all entries when n exceeds length', () => {
    expect(sliceTail(makeEntries(3), 10)).toHaveLength(3);
  });
});

describe('sliceRange', () => {
  it('skips the first n entries', () => {
    const entries = makeEntries(5);
    expect(sliceRange(entries, 2, 0).map((e) => e.message)).toEqual(['msg 2', 'msg 3', 'msg 4']);
  });

  it('limits the result', () => {
    const entries = makeEntries(5);
    expect(sliceRange(entries, 1, 2).map((e) => e.message)).toEqual(['msg 1', 'msg 2']);
  });

  it('handles skip larger than length', () => {
    expect(sliceRange(makeEntries(3), 10, 0)).toHaveLength(0);
  });
});

describe('sliceEntries', () => {
  const entries = makeEntries(6);

  it('applies head option', () => {
    expect(sliceEntries(entries, { head: 2 })).toHaveLength(2);
  });

  it('applies tail option', () => {
    const result = sliceEntries(entries, { tail: 2 });
    expect(result.map((e) => e.message)).toEqual(['msg 4', 'msg 5']);
  });

  it('applies skip and limit options', () => {
    const result = sliceEntries(entries, { skip: 2, limit: 3 });
    expect(result.map((e) => e.message)).toEqual(['msg 2', 'msg 3', 'msg 4']);
  });

  it('returns all entries when no options set', () => {
    expect(sliceEntries(entries, {})).toHaveLength(6);
  });

  it('head takes priority over tail', () => {
    expect(sliceEntries(entries, { head: 1, tail: 3 })).toHaveLength(1);
  });
});
