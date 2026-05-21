import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

const CLI = path.resolve(__dirname, '../dist/index.js');

const SAMPLE_LOGS = [
  JSON.stringify({ timestamp: '2024-01-01T10:00:00Z', level: 'info', message: 'Server started' }),
  JSON.stringify({ timestamp: '2024-01-01T11:00:00Z', level: 'warn', message: 'High memory' }),
  JSON.stringify({ timestamp: '2024-01-01T12:00:00Z', level: 'error', message: 'Crash detected' }),
  'not-json-line',
].join('\n');

function writeTempFile(content: string): string {
  const tmpFile = path.join(os.tmpdir(), `logslice-test-${Date.now()}.log`);
  fs.writeFileSync(tmpFile, content, 'utf8');
  return tmpFile;
}

describe('CLI integration (index.ts)', () => {
  let tmpFile: string;

  beforeAll(() => {
    tmpFile = writeTempFile(SAMPLE_LOGS);
  });

  afterAll(() => {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  });

  it('should exit with error when no input is provided', () => {
    expect(() =>
      execSync(`node ${CLI}`, { stdio: 'pipe' })
    ).toThrow();
  });

  it('should exit with error when file does not exist', () => {
    expect(() =>
      execSync(`node ${CLI} --file /nonexistent/file.log`, { stdio: 'pipe' })
    ).toThrow();
  });

  it('should read from a file and output ndjson', () => {
    const result = execSync(
      `node ${CLI} --file ${tmpFile} --format ndjson --no-color`,
      { encoding: 'utf8' }
    );
    const lines = result.trim().split('\n').filter(Boolean);
    expect(lines.length).toBe(3);
    lines.forEach((line) => {
      expect(() => JSON.parse(line)).not.toThrow();
    });
  });

  it('should filter by level', () => {
    const result = execSync(
      `node ${CLI} --file ${tmpFile} --level error --format ndjson --no-color`,
      { encoding: 'utf8' }
    );
    const lines = result.trim().split('\n').filter(Boolean);
    expect(lines.length).toBe(1);
    const entry = JSON.parse(lines[0]);
    expect(entry.level).toBe('error');
  });

  it('should write output to a file when --output is specified', () => {
    const outFile = path.join(os.tmpdir(), `logslice-out-${Date.now()}.json`);
    execSync(
      `node ${CLI} --file ${tmpFile} --format ndjson --no-color --output ${outFile}`,
      { encoding: 'utf8' }
    );
    expect(fs.existsSync(outFile)).toBe(true);
    const content = fs.readFileSync(outFile, 'utf8');
    expect(content.trim().length).toBeGreaterThan(0);
    fs.unlinkSync(outFile);
  });
});
