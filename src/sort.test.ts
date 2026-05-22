import { sortEntries, parseSortOption, SortOptions } from './sort';
import { LogEntry } from './parser';

function makeEntry(overrides: Partial<LogEntry> & { raw?: Record<string, unknown> }): LogEntry {
  return {
    timestamp: new Date('2024-01-01T00:00:00Z'),
    level: 'info',
    message: 'test',
    raw: {},
    ...overrides,
  } as LogEntry;
}

describe('parseSortOption', () => {
  it('parses field with default asc order', () => {
    expect(parseSortOption('timestamp')).toEqual({ field: 'timestamp', order: 'asc' });
  });

  it('parses field with explicit desc order', () => {
    expect(parseSortOption('level:desc')).toEqual({ field: 'level', order: 'desc' });
  });

  it('parses field with explicit asc order', () => {
    expect(parseSortOption('message:asc')).toEqual({ field: 'message', order: 'asc' });
  });

  it('throws on empty string', () => {
    expect(() => parseSortOption('')).toThrow('Invalid sort option');
  });
});

describe('sortEntries', () => {
  const entries = [
    makeEntry({ timestamp: new Date('2024-01-03T00:00:00Z'), level: 'error' }),
    makeEntry({ timestamp: new Date('2024-01-01T00:00:00Z'), level: 'debug' }),
    makeEntry({ timestamp: new Date('2024-01-02T00:00:00Z'), level: 'warn' }),
  ];

  it('sorts by timestamp ascending', () => {
    const result = sortEntries(entries, { field: 'timestamp', order: 'asc' });
    expect(result[0].timestamp).toEqual(new Date('2024-01-01T00:00:00Z'));
    expect(result[2].timestamp).toEqual(new Date('2024-01-03T00:00:00Z'));
  });

  it('sorts by timestamp descending', () => {
    const result = sortEntries(entries, { field: 'timestamp', order: 'desc' });
    expect(result[0].timestamp).toEqual(new Date('2024-01-03T00:00:00Z'));
    expect(result[2].timestamp).toEqual(new Date('2024-01-01T00:00:00Z'));
  });

  it('sorts by level ascending (trace < debug < info < warn < error < fatal)', () => {
    const result = sortEntries(entries, { field: 'level', order: 'asc' });
    expect(result[0].level).toBe('debug');
    expect(result[2].level).toBe('error');
  });

  it('sorts by level descending', () => {
    const result = sortEntries(entries, { field: 'level', order: 'desc' });
    expect(result[0].level).toBe('error');
    expect(result[2].level).toBe('debug');
  });

  it('does not mutate the original array', () => {
    const original = [...entries];
    sortEntries(entries, { field: 'timestamp', order: 'asc' });
    expect(entries).toEqual(original);
  });

  it('handles empty array', () => {
    expect(sortEntries([], { field: 'timestamp', order: 'asc' })).toEqual([]);
  });

  it('sorts by arbitrary raw field', () => {
    const e1 = makeEntry({ raw: { requestId: 'b' } });
    const e2 = makeEntry({ raw: { requestId: 'a' } });
    const result = sortEntries([e1, e2], { field: 'requestId', order: 'asc' });
    expect(result[0].raw['requestId']).toBe('a');
  });
});
