import { convertEntries, entriesToDelimited, entriesToJsonArray } from './convert';
import { LogEntry } from './parser';

const entries: LogEntry[] = [
  { timestamp: '2024-01-01T00:00:00Z', level: 'info', message: 'start', code: 200 },
  { timestamp: '2024-01-01T00:01:00Z', level: 'error', message: 'fail, hard', code: 500 },
];

describe('entriesToDelimited', () => {
  it('produces CSV with header', () => {
    const result = entriesToDelimited(entries, ',');
    const lines = result.split('\n');
    expect(lines[0]).toBe('timestamp,level,message,code');
    expect(lines[1]).toContain('2024-01-01T00:00:00Z');
  });

  it('quotes values containing delimiter', () => {
    const result = entriesToDelimited(entries, ',');
    expect(result).toContain('"fail, hard"');
  });

  it('omits header when includeHeader is false', () => {
    const result = entriesToDelimited(entries, ',', undefined, false);
    const lines = result.split('\n');
    expect(lines[0]).toContain('2024-01-01T00:00:00Z');
  });

  it('respects custom field selection', () => {
    const result = entriesToDelimited(entries, ',', ['level', 'message']);
    const lines = result.split('\n');
    expect(lines[0]).toBe('level,message');
    expect(lines[1]).toBe('info,start');
  });

  it('produces TSV output', () => {
    const result = entriesToDelimited(entries, '\t');
    expect(result.split('\n')[0]).toBe('timestamp\tlevel\tmessage\tcode');
  });
});

describe('entriesToJsonArray', () => {
  it('returns a valid JSON array string', () => {
    const result = entriesToJsonArray(entries);
    const parsed = JSON.parse(result);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].level).toBe('info');
  });
});

describe('convertEntries', () => {
  it('converts to csv format', () => {
    const result = convertEntries(entries, { format: 'csv' });
    expect(result).toContain('timestamp,level');
  });

  it('converts to tsv format', () => {
    const result = convertEntries(entries, { format: 'tsv' });
    expect(result).toContain('timestamp\tlevel');
  });

  it('converts to jsonarray format', () => {
    const result = convertEntries(entries, { format: 'jsonarray' });
    expect(JSON.parse(result)).toHaveLength(2);
  });

  it('throws on unknown format', () => {
    expect(() => convertEntries(entries, { format: 'xml' as any })).toThrow('Unknown format');
  });
});
