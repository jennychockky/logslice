import { parseLogLine, parseLogLines, LogEntry } from './parser';

describe('parseLogLine', () => {
  it('parses a valid log entry with timestamp field', () => {
    const line = JSON.stringify({ timestamp: '2024-01-15T10:00:00Z', level: 'info', message: 'started' });
    const result = parseLogLine(line);
    expect(result.error).toBeNull();
    expect(result.entry).not.toBeNull();
    expect(result.entry?.timestamp).toBe('2024-01-15T10:00:00Z');
    expect(result.entry?.level).toBe('info');
  });

  it('accepts alternative timestamp keys: time, ts, @timestamp', () => {
    const aliases = ['time', 'ts', '@timestamp'];
    for (const key of aliases) {
      const line = JSON.stringify({ [key]: '2024-01-15T10:00:00Z', msg: 'ok' });
      const result = parseLogLine(line);
      expect(result.error).toBeNull();
      expect(result.entry?.timestamp).toBe('2024-01-15T10:00:00Z');
    }
  });

  it('returns error for empty line', () => {
    const result = parseLogLine('   ');
    expect(result.entry).toBeNull();
    expect(result.error).toBe('empty line');
  });

  it('returns error for invalid JSON', () => {
    const result = parseLogLine('not json at all');
    expect(result.entry).toBeNull();
    expect(result.error).toBe('invalid JSON');
  });

  it('returns error for JSON array', () => {
    const result = parseLogLine('[1, 2, 3]');
    expect(result.entry).toBeNull();
    expect(result.error).toBe('not a JSON object');
  });

  it('returns error when timestamp field is missing', () => {
    const line = JSON.stringify({ level: 'warn', message: 'no time here' });
    const result = parseLogLine(line);
    expect(result.entry).toBeNull();
    expect(result.error).toBe('missing or invalid timestamp field');
  });

  it('preserves all original fields on the entry', () => {
    const line = JSON.stringify({ timestamp: '2024-01-15T10:00:00Z', requestId: 'abc-123', status: 200 });
    const result = parseLogLine(line);
    expect(result.entry?.requestId).toBe('abc-123');
    expect(result.entry?.status).toBe(200);
  });
});

describe('parseLogLines', () => {
  it('returns only successfully parsed entries', () => {
    const lines = [
      JSON.stringify({ timestamp: '2024-01-15T10:00:00Z', message: 'a' }),
      'bad line',
      '',
      JSON.stringify({ timestamp: '2024-01-15T10:01:00Z', message: 'b' }),
    ];
    const entries: LogEntry[] = parseLogLines(lines);
    expect(entries).toHaveLength(2);
    expect(entries[0].message).toBe('a');
    expect(entries[1].message).toBe('b');
  });

  it('returns empty array when all lines are invalid', () => {
    const entries = parseLogLines(['garbage', '', '{}']);
    expect(entries).toHaveLength(0);
  });
});
