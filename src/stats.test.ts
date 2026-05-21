import { computeStats, formatStats } from './stats';
import { LogEntry } from './parser';

const sampleEntries: LogEntry[] = [
  { timestamp: '2024-01-01T10:00:00Z', level: 'info',  message: 'started', service: 'api' },
  { timestamp: '2024-01-01T10:05:00Z', level: 'warn',  message: 'slow query' },
  { timestamp: '2024-01-01T10:10:00Z', level: 'error', message: 'failed', code: 500 },
  { timestamp: '2024-01-01T09:00:00Z', level: 'info',  message: 'boot' },
];

describe('computeStats', () => {
  it('counts total entries', () => {
    const stats = computeStats(sampleEntries);
    expect(stats.total).toBe(4);
  });

  it('counts entries by level', () => {
    const stats = computeStats(sampleEntries);
    expect(stats.byLevel['info']).toBe(2);
    expect(stats.byLevel['warn']).toBe(1);
    expect(stats.byLevel['error']).toBe(1);
  });

  it('finds earliest and latest timestamps', () => {
    const stats = computeStats(sampleEntries);
    expect(stats.earliest).toBe('2024-01-01T09:00:00Z');
    expect(stats.latest).toBe('2024-01-01T10:10:00Z');
  });

  it('collects all unique field names', () => {
    const stats = computeStats(sampleEntries);
    expect(stats.fields.has('timestamp')).toBe(true);
    expect(stats.fields.has('level')).toBe(true);
    expect(stats.fields.has('message')).toBe(true);
    expect(stats.fields.has('service')).toBe(true);
    expect(stats.fields.has('code')).toBe(true);
  });

  it('handles empty entries', () => {
    const stats = computeStats([]);
    expect(stats.total).toBe(0);
    expect(stats.earliest).toBeNull();
    expect(stats.latest).toBeNull();
    expect(Object.keys(stats.byLevel)).toHaveLength(0);
  });

  it('uses "unknown" level for entries without level field', () => {
    const entries: LogEntry[] = [{ timestamp: '2024-01-01T00:00:00Z', message: 'no level' }];
    const stats = computeStats(entries);
    expect(stats.byLevel['unknown']).toBe(1);
  });
});

describe('formatStats', () => {
  it('returns a non-empty string', () => {
    const stats = computeStats(sampleEntries);
    const output = formatStats(stats);
    expect(typeof output).toBe('string');
    expect(output.length).toBeGreaterThan(0);
  });

  it('includes total count', () => {
    const stats = computeStats(sampleEntries);
    expect(formatStats(stats)).toContain('4');
  });

  it('includes level names', () => {
    const stats = computeStats(sampleEntries);
    const output = formatStats(stats);
    expect(output).toContain('info');
    expect(output).toContain('warn');
    expect(output).toContain('error');
  });

  it('includes time range', () => {
    const stats = computeStats(sampleEntries);
    const output = formatStats(stats);
    expect(output).toContain('2024-01-01T09:00:00Z');
    expect(output).toContain('2024-01-01T10:10:00Z');
  });
});
