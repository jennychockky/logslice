import {
  buildDedupKey,
  deduplicateEntries,
  countDuplicates,
} from './dedup';

const makeEntry = (msg: string, level: string, extra?: Record<string, unknown>) => ({
  timestamp: '2024-01-01T00:00:00Z',
  level,
  message: msg,
  ...extra,
});

describe('buildDedupKey', () => {
  it('builds a key from specified fields', () => {
    const entry = makeEntry('hello', 'info');
    expect(buildDedupKey(entry, ['message', 'level'])).toBe('hello\x00info');
  });

  it('uses empty string for missing fields', () => {
    const entry = makeEntry('hello', 'info');
    expect(buildDedupKey(entry, ['message', 'nonexistent'])).toBe('hello\x00');
  });

  it('handles a single key field', () => {
    const entry = makeEntry('hello', 'info');
    expect(buildDedupKey(entry, ['message'])).toBe('hello');
  });
});

describe('deduplicateEntries', () => {
  it('removes duplicate entries with default key fields', () => {
    const entries = [
      makeEntry('foo', 'info'),
      makeEntry('bar', 'warn'),
      makeEntry('foo', 'info'),
    ];
    const result = deduplicateEntries(entries);
    expect(result).toHaveLength(2);
    expect(result[0].message).toBe('foo');
    expect(result[1].message).toBe('bar');
  });

  it('keeps all entries when none are duplicates', () => {
    const entries = [
      makeEntry('foo', 'info'),
      makeEntry('bar', 'info'),
      makeEntry('foo', 'error'),
    ];
    const result = deduplicateEntries(entries);
    expect(result).toHaveLength(3);
  });

  it('keeps last occurrence when keepLast is true', () => {
    const entries = [
      makeEntry('foo', 'info', { requestId: 'a' }),
      makeEntry('bar', 'warn', { requestId: 'b' }),
      makeEntry('foo', 'info', { requestId: 'c' }),
    ];
    const result = deduplicateEntries(entries, { keepLast: true });
    expect(result).toHaveLength(2);
    const fooEntry = result.find((e) => e.message === 'foo');
    expect(fooEntry?.requestId).toBe('c');
  });

  it('supports custom key fields', () => {
    const entries = [
      makeEntry('foo', 'info', { requestId: 'x' }),
      makeEntry('foo', 'info', { requestId: 'x' }),
      makeEntry('foo', 'info', { requestId: 'y' }),
    ];
    const result = deduplicateEntries(entries, { keyFields: ['message', 'requestId'] });
    expect(result).toHaveLength(2);
  });

  it('returns empty array for empty input', () => {
    expect(deduplicateEntries([])).toEqual([]);
  });
});

describe('countDuplicates', () => {
  it('counts duplicate entries correctly', () => {
    const entries = [
      makeEntry('foo', 'info'),
      makeEntry('foo', 'info'),
      makeEntry('foo', 'info'),
      makeEntry('bar', 'warn'),
    ];
    expect(countDuplicates(entries)).toBe(2);
  });

  it('returns 0 when no duplicates', () => {
    const entries = [
      makeEntry('foo', 'info'),
      makeEntry('bar', 'warn'),
    ];
    expect(countDuplicates(entries)).toBe(0);
  });

  it('returns 0 for empty input', () => {
    expect(countDuplicates([])).toBe(0);
  });
});
