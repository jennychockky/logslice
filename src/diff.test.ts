import { diffEntries, formatDiffSummary, DiffResult } from './diff';
import { LogEntry } from './parser';

function makeEntry(overrides: Record<string, unknown> = {}): LogEntry {
  return {
    timestamp: '2024-01-01T00:00:00Z',
    level: 'info',
    message: 'test message',
    ...overrides,
  } as LogEntry;
}

describe('diffEntries', () => {
  it('identifies added entries', () => {
    const base: LogEntry[] = [makeEntry({ message: 'alpha' })];
    const compare: LogEntry[] = [
      makeEntry({ message: 'alpha' }),
      makeEntry({ message: 'beta' }),
    ];
    const result = diffEntries(base, compare);
    expect(result.added).toHaveLength(1);
    expect((result.added[0] as Record<string, unknown>).message).toBe('beta');
    expect(result.removed).toHaveLength(0);
    expect(result.common).toHaveLength(1);
  });

  it('identifies removed entries', () => {
    const base: LogEntry[] = [
      makeEntry({ message: 'alpha' }),
      makeEntry({ message: 'gamma' }),
    ];
    const compare: LogEntry[] = [makeEntry({ message: 'alpha' })];
    const result = diffEntries(base, compare);
    expect(result.removed).toHaveLength(1);
    expect((result.removed[0] as Record<string, unknown>).message).toBe('gamma');
    expect(result.added).toHaveLength(0);
  });

  it('uses keyFields when provided', () => {
    const base: LogEntry[] = [makeEntry({ id: '1', message: 'old' })];
    const compare: LogEntry[] = [makeEntry({ id: '1', message: 'new' })];
    const result = diffEntries(base, compare, { keyFields: ['id'] });
    expect(result.common).toHaveLength(1);
    expect(result.added).toHaveLength(0);
    expect(result.removed).toHaveLength(0);
  });

  it('ignores specified fields in comparison', () => {
    const base: LogEntry[] = [makeEntry({ message: 'hello', requestId: 'abc' })];
    const compare: LogEntry[] = [makeEntry({ message: 'hello', requestId: 'xyz' })];
    const result = diffEntries(base, compare, { ignoreFields: ['requestId', 'timestamp'] });
    expect(result.common).toHaveLength(1);
  });

  it('returns empty result for identical inputs', () => {
    const entries: LogEntry[] = [makeEntry({ message: 'same' })];
    const result = diffEntries(entries, entries);
    expect(result.added).toHaveLength(0);
    expect(result.removed).toHaveLength(0);
    expect(result.common).toHaveLength(1);
  });

  it('handles empty base', () => {
    const compare: LogEntry[] = [makeEntry({ message: 'new' })];
    const result = diffEntries([], compare);
    expect(result.added).toHaveLength(1);
    expect(result.removed).toHaveLength(0);
  });
});

describe('formatDiffSummary', () => {
  it('formats summary correctly', () => {
    const result: DiffResult = {
      added: [makeEntry()],
      removed: [],
      common: [makeEntry(), makeEntry()],
    };
    const summary = formatDiffSummary(result);
    expect(summary).toContain('Added:   1');
    expect(summary).toContain('Removed: 0');
    expect(summary).toContain('Common:  2');
  });
});
