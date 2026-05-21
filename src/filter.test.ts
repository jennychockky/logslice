import {
  filterByTimeRange,
  filterByFields,
  filterByLevel,
  applyFilters,
} from './filter';
import { LogEntry } from './parser';

const sampleEntries: LogEntry[] = [
  { timestamp: '2024-01-15T10:00:00Z', level: 'info', message: 'Server started', service: 'api' },
  { timestamp: '2024-01-15T10:05:00Z', level: 'warn', message: 'High memory', service: 'api' },
  { timestamp: '2024-01-15T10:10:00Z', level: 'error', message: 'DB connection failed', service: 'db' },
  { timestamp: '2024-01-15T10:15:00Z', level: 'info', message: 'Request handled', service: 'api' },
];

describe('filterByTimeRange', () => {
  it('filters entries after from date', () => {
    const from = new Date('2024-01-15T10:06:00Z');
    const result = filterByTimeRange(sampleEntries, from, undefined);
    expect(result).toHaveLength(2);
    expect(result[0].message).toBe('DB connection failed');
  });

  it('filters entries before to date', () => {
    const to = new Date('2024-01-15T10:08:00Z');
    const result = filterByTimeRange(sampleEntries, undefined, to);
    expect(result).toHaveLength(2);
  });

  it('filters entries within range', () => {
    const from = new Date('2024-01-15T10:04:00Z');
    const to = new Date('2024-01-15T10:11:00Z');
    const result = filterByTimeRange(sampleEntries, from, to);
    expect(result).toHaveLength(2);
  });

  it('excludes entries without timestamp', () => {
    const entries: LogEntry[] = [{ message: 'no timestamp' }];
    expect(filterByTimeRange(entries, new Date(), undefined)).toHaveLength(0);
  });
});

describe('filterByFields', () => {
  it('filters by exact string match', () => {
    const result = filterByFields(sampleEntries, { service: 'db' });
    expect(result).toHaveLength(1);
    expect(result[0].message).toBe('DB connection failed');
  });

  it('filters by regex pattern', () => {
    const result = filterByFields(sampleEntries, { message: /connection/i });
    expect(result).toHaveLength(1);
  });

  it('returns empty when field missing', () => {
    const result = filterByFields(sampleEntries, { nonexistent: 'value' });
    expect(result).toHaveLength(0);
  });
});

describe('filterByLevel', () => {
  it('filters by single level', () => {
    const result = filterByLevel(sampleEntries, 'error');
    expect(result).toHaveLength(1);
  });

  it('filters by multiple levels', () => {
    const result = filterByLevel(sampleEntries, ['info', 'warn']);
    expect(result).toHaveLength(3);
  });

  it('is case-insensitive', () => {
    const result = filterByLevel(sampleEntries, 'INFO');
    expect(result).toHaveLength(2);
  });
});

describe('applyFilters', () => {
  it('combines multiple filters', () => {
    const result = applyFilters(sampleEntries, {
      from: new Date('2024-01-15T10:00:00Z'),
      level: 'info',
      fields: { service: 'api' },
    });
    expect(result).toHaveLength(2);
  });

  it('returns all entries with empty options', () => {
    const result = applyFilters(sampleEntries, {});
    expect(result).toHaveLength(4);
  });
});
