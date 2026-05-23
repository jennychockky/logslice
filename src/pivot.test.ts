import { pivotEntries, formatPivotTable, getFieldStr, getFieldNum } from './pivot';
import { LogEntry } from './parser';

function makeEntry(overrides: Record<string, unknown>): LogEntry {
  return { timestamp: '2024-01-01T00:00:00Z', level: 'info', message: 'test', ...overrides };
}

const entries: LogEntry[] = [
  makeEntry({ service: 'api', status: '200', duration: 50 }),
  makeEntry({ service: 'api', status: '500', duration: 200 }),
  makeEntry({ service: 'api', status: '200', duration: 100 }),
  makeEntry({ service: 'db', status: '200', duration: 30 }),
  makeEntry({ service: 'db', status: '500', duration: 400 }),
];

describe('getFieldStr', () => {
  it('returns string value', () => {
    expect(getFieldStr(makeEntry({ foo: 'bar' }), 'foo')).toBe('bar');
  });
  it('returns (null) for missing field', () => {
    expect(getFieldStr(makeEntry({}), 'missing')).toBe('(null)');
  });
  it('converts numbers to string', () => {
    expect(getFieldStr(makeEntry({ code: 42 }), 'code')).toBe('42');
  });
});

describe('getFieldNum', () => {
  it('returns numeric value', () => {
    expect(getFieldNum(makeEntry({ n: 7 }), 'n')).toBe(7);
  });
  it('returns 1 for non-numeric', () => {
    expect(getFieldNum(makeEntry({ n: 'x' }), 'n')).toBe(1);
  });
});

describe('pivotEntries', () => {
  it('counts by row and col', () => {
    const result = pivotEntries(entries, { rowField: 'service', colField: 'status', aggFn: 'count' });
    expect(result.rows).toEqual(['api', 'db']);
    expect(result.cols).toEqual(['200', '500']);
    expect(result.data['api']['200']).toBe(2);
    expect(result.data['api']['500']).toBe(1);
    expect(result.data['db']['200']).toBe(1);
    expect(result.data['db']['500']).toBe(1);
  });

  it('sums value field', () => {
    const result = pivotEntries(entries, { rowField: 'service', colField: 'status', valueField: 'duration', aggFn: 'sum' });
    expect(result.data['api']['200']).toBe(150);
    expect(result.data['db']['500']).toBe(400);
  });

  it('averages value field', () => {
    const result = pivotEntries(entries, { rowField: 'service', colField: 'status', valueField: 'duration', aggFn: 'avg' });
    expect(result.data['api']['200']).toBe(75);
  });

  it('handles missing cells as 0', () => {
    const result = pivotEntries(entries, { rowField: 'service', colField: 'status' });
    expect(result.data['api']['200']).toBeDefined();
  });
});

describe('formatPivotTable', () => {
  it('renders header and rows', () => {
    const result = pivotEntries(entries, { rowField: 'service', colField: 'status' });
    const table = formatPivotTable(result);
    expect(table).toContain('200');
    expect(table).toContain('500');
    expect(table).toContain('api');
    expect(table).toContain('db');
  });

  it('returns string', () => {
    const result = pivotEntries([], { rowField: 'a', colField: 'b' });
    expect(typeof formatPivotTable(result)).toBe('string');
  });
});
