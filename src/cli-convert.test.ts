import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { parseConvertArgs } from './cli-convert';

function writeTempFile(lines: string[]): string {
  const file = path.join(os.tmpdir(), `logslice-convert-test-${Date.now()}.ndjson`);
  fs.writeFileSync(file, lines.join('\n'), 'utf8');
  return file;
}

describe('parseConvertArgs', () => {
  it('defaults to csv format with header', () => {
    const opts = parseConvertArgs(['node', 'cli-convert.ts']);
    expect(opts.format).toBe('csv');
    expect(opts.includeHeader).toBe(true);
    expect(opts.fields).toBeUndefined();
    expect(opts.inputFile).toBeUndefined();
    expect(opts.outputFile).toBeUndefined();
  });

  it('parses --format tsv', () => {
    const opts = parseConvertArgs(['node', 'cli-convert.ts', '--format', 'tsv']);
    expect(opts.format).toBe('tsv');
  });

  it('parses --fields', () => {
    const opts = parseConvertArgs(['node', 'cli-convert.ts', '--fields', 'level,message']);
    expect(opts.fields).toEqual(['level', 'message']);
  });

  it('parses --no-header', () => {
    const opts = parseConvertArgs(['node', 'cli-convert.ts', '--no-header']);
    expect(opts.includeHeader).toBe(false);
  });

  it('parses --out flag', () => {
    const opts = parseConvertArgs(['node', 'cli-convert.ts', '--out', '/tmp/out.csv']);
    expect(opts.outputFile).toBe('/tmp/out.csv');
  });

  it('parses positional input file', () => {
    const opts = parseConvertArgs(['node', 'cli-convert.ts', 'logs.ndjson']);
    expect(opts.inputFile).toBe('logs.ndjson');
  });

  it('parses combined options', () => {
    const opts = parseConvertArgs([
      'node', 'cli-convert.ts',
      '--format', 'jsonarray',
      '--fields', 'ts,msg',
      '--no-header',
      '--out', '/tmp/result.json',
      'input.ndjson',
    ]);
    expect(opts.format).toBe('jsonarray');
    expect(opts.fields).toEqual(['ts', 'msg']);
    expect(opts.includeHeader).toBe(false);
    expect(opts.outputFile).toBe('/tmp/result.json');
    expect(opts.inputFile).toBe('input.ndjson');
  });
});

describe('cli-convert integration', () => {
  it('writes csv output to file', () => {
    const input = writeTempFile([
      JSON.stringify({ timestamp: '2024-01-01T00:00:00Z', level: 'info', message: 'hello' }),
    ]);
    const output = path.join(os.tmpdir(), `out-${Date.now()}.csv`);
    const { execSync } = require('child_process');
    execSync(`npx ts-node src/cli-convert.ts --format csv --out ${output} ${input}`);
    const content = fs.readFileSync(output, 'utf8');
    expect(content).toContain('timestamp,level,message');
    expect(content).toContain('info');
    fs.unlinkSync(input);
    fs.unlinkSync(output);
  });
});
