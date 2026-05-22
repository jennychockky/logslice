import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { parseArgs } from './cli-merge';

function writeTempFile(lines: string[]): string {
  const tmp = path.join(os.tmpdir(), `logslice-merge-test-${Date.now()}-${Math.random()}.ndjson`);
  fs.writeFileSync(tmp, lines.join('\n'), 'utf8');
  return tmp;
}

describe('parseArgs', () => {
  it('parses file paths', () => {
    const { files } = parseArgs(['a.ndjson', 'b.ndjson']);
    expect(files).toEqual(['a.ndjson', 'b.ndjson']);
  });

  it('parses --sort option', () => {
    const { options } = parseArgs(['--sort', 'timestamp', 'a.ndjson', 'b.ndjson']);
    expect(options.sortField).toBe('timestamp');
  });

  it('parses --dedup flag', () => {
    const { options } = parseArgs(['--dedup', 'a.ndjson', 'b.ndjson']);
    expect(options.dedup).toBe(true);
  });

  it('parses --dedup-fields option', () => {
    const { options } = parseArgs(['--dedup-fields', 'level,message', 'a.ndjson']);
    expect(options.dedupFields).toEqual(['level', 'message']);
  });

  it('parses --pretty flag', () => {
    const { pretty } = parseArgs(['--pretty', 'a.ndjson', 'b.ndjson']);
    expect(pretty).toBe(true);
  });

  it('defaults dedup to undefined when not set', () => {
    const { options } = parseArgs(['a.ndjson']);
    expect(options.dedup).toBeUndefined();
  });

  it('defaults pretty to false', () => {
    const { pretty } = parseArgs(['a.ndjson']);
    expect(pretty).toBe(false);
  });

  it('handles multiple files alongside options', () => {
    const { files, options } = parseArgs([
      '--sort', 'timestamp',
      '--dedup',
      'file1.ndjson',
      'file2.ndjson',
      'file3.ndjson',
    ]);
    expect(files).toHaveLength(3);
    expect(options.sortField).toBe('timestamp');
    expect(options.dedup).toBe(true);
  });
});

describe('writeTempFile helper', () => {
  it('creates a readable temp file', () => {
    const tmp = writeTempFile(['{"level":"info","message":"hello"}']);
    expect(fs.existsSync(tmp)).toBe(true);
    fs.unlinkSync(tmp);
  });
});
