import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { parsePivotArgs } from './cli-pivot';
import { validatePivotOptions, describePivotOptions, mergePivotOptions } from './pivot-options';

function writeTempFile(content: string): string {
  const file = path.join(os.tmpdir(), `pivot-test-${Date.now()}.ndjson`);
  fs.writeFileSync(file, content, 'utf8');
  return file;
}

describe('parsePivotArgs', () => {
  it('parses required row and col', () => {
    const opts = parsePivotArgs(['node', 'cli-pivot', '--row', 'service', '--col', 'status']);
    expect(opts.rowField).toBe('service');
    expect(opts.colField).toBe('status');
  });

  it('defaults aggFn to count', () => {
    const opts = parsePivotArgs(['node', 'cli-pivot', '--row', 'a', '--col', 'b']);
    expect(opts.aggFn).toBe('count');
  });

  it('parses --agg and --value', () => {
    const opts = parsePivotArgs(['node', 'cli-pivot', '--row', 'a', '--col', 'b', '--agg', 'sum', '--value', 'dur']);
    expect(opts.aggFn).toBe('sum');
    expect(opts.valueField).toBe('dur');
  });

  it('parses positional input file', () => {
    const f = writeTempFile('');
    const opts = parsePivotArgs(['node', 'cli-pivot', '--row', 'a', '--col', 'b', f]);
    expect(opts.inputFile).toBe(f);
    fs.unlinkSync(f);
  });

  it('parses --output', () => {
    const opts = parsePivotArgs(['node', 'cli-pivot', '--row', 'a', '--col', 'b', '--output', '/tmp/out.txt']);
    expect(opts.outputFile).toBe('/tmp/out.txt');
  });
});

describe('validatePivotOptions', () => {
  it('returns errors for missing row/col', () => {
    const errs = validatePivotOptions({});
    expect(errs).toContain('--row is required');
    expect(errs).toContain('--col is required');
  });

  it('returns error for invalid aggFn', () => {
    const errs = validatePivotOptions({ rowField: 'a', colField: 'b', aggFn: 'max' as any });
    expect(errs.some(e => e.includes('agg'))).toBe(true);
  });

  it('returns error when sum used without value', () => {
    const errs = validatePivotOptions({ rowField: 'a', colField: 'b', aggFn: 'sum' });
    expect(errs.some(e => e.includes('--value'))).toBe(true);
  });

  it('passes valid options', () => {
    expect(validatePivotOptions({ rowField: 'a', colField: 'b', aggFn: 'count' })).toHaveLength(0);
  });
});

describe('describePivotOptions', () => {
  it('includes row and col', () => {
    const desc = describePivotOptions({ rowField: 'svc', colField: 'env', aggFn: 'count' });
    expect(desc).toContain('row=svc');
    expect(desc).toContain('col=env');
  });
});

describe('mergePivotOptions', () => {
  it('merges options with override taking priority', () => {
    const merged = mergePivotOptions({ rowField: 'a', aggFn: 'count' }, { aggFn: 'sum', valueField: 'v' });
    expect(merged.aggFn).toBe('sum');
    expect(merged.valueField).toBe('v');
    expect(merged.rowField).toBe('a');
  });
});
