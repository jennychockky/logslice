import { repairJsonLine, repairLines } from './repair';

describe('repairJsonLine', () => {
  it('parses a valid JSON object without repair', () => {
    const result = repairJsonLine('{"level":"info","msg":"hello"}');
    expect(result.entry).toEqual({ level: 'info', msg: 'hello' });
    expect(result.repaired).toBe(false);
  });

  it('returns null for empty line', () => {
    const result = repairJsonLine('   ');
    expect(result.entry).toBeNull();
    expect(result.error).toBe('empty line');
  });

  it('returns null for a JSON array', () => {
    const result = repairJsonLine('[1,2,3]');
    expect(result.entry).toBeNull();
    expect(result.error).toBe('not a JSON object');
  });

  it('repairs trailing commas in object', () => {
    const result = repairJsonLine('{"level":"info","msg":"hello",}');
    expect(result.entry).toEqual({ level: 'info', msg: 'hello' });
    expect(result.repaired).toBe(true);
  });

  it('repairs trailing commas in nested structure', () => {
    const result = repairJsonLine('{"a":1,"b":[1,2,],}');
    expect(result.entry).toEqual({ a: 1, b: [1, 2] });
    expect(result.repaired).toBe(true);
  });

  it('parses key=value logfmt style lines', () => {
    const result = repairJsonLine('level=info msg=hello count=42');
    expect(result.entry).toEqual({ level: 'info', msg: 'hello', count: 42 });
    expect(result.repaired).toBe(true);
  });

  it('returns null for completely unparseable input', () => {
    const result = repairJsonLine('this is not json or kv');
    expect(result.entry).toBeNull();
    expect(result.error).toBe('unable to repair');
  });

  it('handles numeric values in valid JSON', () => {
    const result = repairJsonLine('{"status":200,"latency":0.45}');
    expect(result.entry).toEqual({ status: 200, latency: 0.45 });
    expect(result.repaired).toBe(false);
  });
});

describe('repairLines', () => {
  it('processes a mix of valid, repairable, and failed lines', () => {
    const lines = [
      '{"level":"info","msg":"ok"}',
      '{"level":"warn","msg":"trailing",}',
      'level=error msg=boom',
      'totally broken }{',
    ];
    const { entries, repairedCount, failedCount } = repairLines(lines);
    expect(entries).toHaveLength(3);
    expect(repairedCount).toBe(2);
    expect(failedCount).toBe(1);
  });

  it('returns empty results for all-empty input', () => {
    const { entries, repairedCount, failedCount } = repairLines(['', '   ', '\t']);
    expect(entries).toHaveLength(0);
    expect(repairedCount).toBe(0);
    expect(failedCount).toBe(3);
  });

  it('counts no repairs when all lines are valid JSON', () => {
    const lines = ['{"a":1}', '{"b":2}'];
    const { entries, repairedCount, failedCount } = repairLines(lines);
    expect(entries).toHaveLength(2);
    expect(repairedCount).toBe(0);
    expect(failedCount).toBe(0);
  });
});
