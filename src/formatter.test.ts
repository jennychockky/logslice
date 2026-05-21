import { formatEntry, formatEntries, FormatOptions } from './formatter';
import { LogEntry } from './parser';

const sampleEntry: LogEntry = {
  timestamp: '2024-01-15T10:30:00.000Z',
  level: 'info',
  message: 'Server started',
  raw: '{"timestamp":"2024-01-15T10:30:00.000Z","level":"info","message":"Server started","port":3000}',
  port: 3000,
};

describe('formatEntry', () => {
  describe('json format', () => {
    it('should output valid JSON string', () => {
      const opts: FormatOptions = { format: 'json' };
      const result = formatEntry(sampleEntry, opts);
      expect(() => JSON.parse(result)).not.toThrow();
    });

    it('should include all fields by default', () => {
      const opts: FormatOptions = { format: 'json' };
      const result = JSON.parse(formatEntry(sampleEntry, opts));
      expect(result.timestamp).toBe(sampleEntry.timestamp);
      expect(result.level).toBe(sampleEntry.level);
      expect(result.message).toBe(sampleEntry.message);
    });

    it('should filter to specified fields only', () => {
      const opts: FormatOptions = { format: 'json', fields: ['level', 'message'] };
      const result = JSON.parse(formatEntry(sampleEntry, opts));
      expect(result.level).toBe('info');
      expect(result.message).toBe('Server started');
      expect(result.timestamp).toBeUndefined();
    });
  });

  describe('pretty format', () => {
    it('should include timestamp, level and message', () => {
      const opts: FormatOptions = { format: 'pretty', colorize: false };
      const result = formatEntry(sampleEntry, opts);
      expect(result).toContain('2024-01-15T10:30:00.000Z');
      expect(result).toContain('info');
      expect(result).toContain('Server started');
    });

    it('should include extra fields as key=value pairs', () => {
      const opts: FormatOptions = { format: 'pretty', colorize: false };
      const result = formatEntry(sampleEntry, opts);
      expect(result).toContain('port=3000');
    });

    it('should apply color codes when colorize is true', () => {
      const opts: FormatOptions = { format: 'pretty', colorize: true };
      const result = formatEntry(sampleEntry, opts);
      expect(result).toContain('\x1b[36m');
    });
  });

  describe('compact format', () => {
    it('should produce single-line JSON', () => {
      const opts: FormatOptions = { format: 'compact' };
      const result = formatEntry(sampleEntry, opts);
      expect(result).not.toContain('\n');
      expect(() => JSON.parse(result)).not.toThrow();
    });
  });
});

describe('formatEntries', () => {
  it('should format multiple entries', () => {
    const entries: LogEntry[] = [
      { ...sampleEntry, message: 'First' },
      { ...sampleEntry, message: 'Second' },
    ];
    const opts: FormatOptions = { format: 'json' };
    const results = formatEntries(entries, opts);
    expect(results).toHaveLength(2);
    expect(JSON.parse(results[0]).message).toBe('First');
    expect(JSON.parse(results[1]).message).toBe('Second');
  });

  it('should return empty array for empty input', () => {
    const results = formatEntries([], { format: 'json' });
    expect(results).toEqual([]);
  });
});
