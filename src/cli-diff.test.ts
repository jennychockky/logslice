import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { parseDiffArgs } from './cli-diff';
import { diffEntries } from './diff';
import { parseValidEntries } from './parser';

function writeTempFile(lines: string[]): string {
  const file = path.join(os.tmpdir(), `logslice-diff-test-${Date.now()}-${Math.random()}.ndjson`);
  fs.writeFileSync(file, lines.join('\n'), 'utf8');
  return file;
}

describe('parseDiffArgs', () => {
  it('returns null when fewer than 2 positional args', () => {
    const result = parseDiffArgs(['node', 'cli-diff.ts', 'only-one.ndjson']);
    expect(result).toBeNull();
  });

  it('returns null for --help', () => {
    const result = parseDiffArgs(['node', 'cli-diff.ts', '--help']);
    expect(result).toBeNull();
  });

  it('parses base and compare files', () => {
    const result = parseDiffArgs(['node', 'cli-diff.ts', 'base.ndjson', 'compare.ndjson']);
    expect(result).not.toBeNull();
    expect(result!.baseFile).toBe('base.ndjson');
    expect(result!.compareFile).toBe('compare.ndjson');
  });

  it('parses --key option', () => {
    const result = parseDiffArgs(['node', 'cli-diff.ts', '--key', 'id,requestId', 'a.ndjson', 'b.ndjson']);
    expect(result!.diffOptions.keyFields).toEqual(['id', 'requestId']);
  });

  it('parses --ignore option', () => {
    const result = parseDiffArgs(['node', 'cli-diff.ts', '--ignore', 'timestamp', 'a.ndjson', 'b.ndjson']);
    expect(result!.diffOptions.ignoreFields).toEqual(['timestamp']);
  });

  it('parses --added flag', () => {
    const result = parseDiffArgs(['node', 'cli-diff.ts', '--added', 'a.ndjson', 'b.ndjson']);
    expect(result!.showAdded).toBe(true);
  });

  it('parses --removed flag', () => {
    const result = parseDiffArgs(['node', 'cli-diff.ts', '--removed', 'a.ndjson', 'b.ndjson']);
    expect(result!.showRemoved).toBe(true);
  });

  it('parses --summary flag', () => {
    const result = parseDiffArgs(['node', 'cli-diff.ts', '--summary', 'a.ndjson', 'b.ndjson']);
    expect(result!.summaryOnly).toBe(true);
  });
});

describe('diffEntries integration', () => {
  it('diffs two ndjson files correctly', () => {
    const baseFile = writeTempFile([
      JSON.stringify({ timestamp: '2024-01-01T00:00:00Z', level: 'info', message: 'start' }),
      JSON.stringify({ timestamp: '2024-01-01T00:01:00Z', level: 'error', message: 'fail' }),
    ]);
    const compareFile = writeTempFile([
      JSON.stringify({ timestamp: '2024-01-01T00:00:00Z', level: 'info', message: 'start' }),
      JSON.stringify({ timestamp: '2024-01-01T00:02:00Z', level: 'warn', message: 'new event' }),
    ]);

    const base = parseValidEntries(fs.readFileSync(baseFile, 'utf8').split('\n'));
    const compare = parseValidEntries(fs.readFileSync(compareFile, 'utf8').split('\n'));
    const result = diffEntries(base, compare, { ignoreFields: ['timestamp'] });

    expect(result.common).toHaveLength(1);
    expect(result.added).toHaveLength(1);
    expect(result.removed).toHaveLength(1);

    fs.unlinkSync(baseFile);
    fs.unlinkSync(compareFile);
  });
});
