import { mergeEntries } from './merge';
import { LogEntry } from './parser';

const makeEntry = (overrides: Partial<LogEntry> = {}): LogEntry => ({
  timestamp: '2024-01-01T00:00:00.000Z',
  level: 'info',
  message: 'test',
  ...overrides,
});

describe('mergeEntries', () => {
  it('merges multiple sources into one array', () => {
    const a = [makeEntry({ message: 'a' })];
    const b = [makeEntry({ message: 'b' })];
    const result = mergeEntries([a, b]);
    expect(result).toHaveLength(2);
    expect(result.map((e) => e.message)).toEqual(['a', 'b']);
  });

  it('returns empty array when no sources provided', () => {
    expect(mergeEntries([])).toEqual([]);
  });

  it('handles empty source arrays', () => {
    const a: LogEntry[] = [];
    const b = [makeEntry({ message: 'b' })];
    expect(mergeEntries([a, b])).toHaveLength(1);
  });

  it('sorts by specified field ascending', () => {
    const entries = [
      makeEntry({ timestamp: '2024-01-03T00:00:00.000Z', message: 'c' }),
      makeEntry({ timestamp: '2024-01-01T00:00:00.000Z', message: 'a' }),
      makeEntry({ timestamp: '2024-01-02T00:00:00.000Z', message: 'b' }),
    ];
    const result = mergeEntries([entries], { sortField: 'timestamp' });
    expect(result.map((e) => e.message)).toEqual(['a', 'b', 'c']);
  });

  it('deduplicates identical entries when dedup is true', () => {
    const entry = makeEntry({ message: 'dup' });
    const result = mergeEntries([[entry, entry]], { dedup: true });
    expect(result).toHaveLength(1);
  });

  it('deduplicates by specific fields', () => {
    const a = makeEntry({ message: 'same', level: 'info' });
    const b = makeEntry({ message: 'same', level: 'error' });
    const result = mergeEntries([[a, b]], { dedup: true, dedupFields: ['message'] });
    expect(result).toHaveLength(1);
  });

  it('keeps distinct entries when deduplicating by fields', () => {
    const a = makeEntry({ message: 'one' });
    const b = makeEntry({ message: 'two' });
    const result = mergeEntries([[a, b]], { dedup: true, dedupFields: ['message'] });
    expect(result).toHaveLength(2);
  });

  it('places entries with undefined sort field last', () => {
    const a = makeEntry({ timestamp: '2024-01-01T00:00:00.000Z' });
    const b = { level: 'info', message: 'no-ts' } as LogEntry;
    const result = mergeEntries([[b, a]], { sortField: 'timestamp' });
    expect(result[0].message).toBe('test');
    expect(result[1].message).toBe('no-ts');
  });
});
