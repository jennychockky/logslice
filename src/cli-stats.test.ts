import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { runStats } from './cli-stats';

function writeTempFile(content: string): string {
  const tmp = path.join(os.tmpdir(), `logslice-stats-${Date.now()}.ndjson`);
  fs.writeFileSync(tmp, content, 'utf8');
  return tmp;
}

const sampleNdjson = [
  JSON.stringify({ timestamp: '2024-03-01T08:00:00Z', level: 'info',  message: 'up' }),
  JSON.stringify({ timestamp: '2024-03-01T08:01:00Z', level: 'warn',  message: 'slow' }),
  JSON.stringify({ timestamp: '2024-03-01T08:02:00Z', level: 'error', message: 'down' }),
  JSON.stringify({ timestamp: '2024-03-01T07:59:00Z', level: 'info',  message: 'boot' }),
].join('\n');

describe('runStats', () => {
  let tmpFile: string;
  let stdoutSpy: jest.SpyInstance;

  beforeEach(() => {
    tmpFile = writeTempFile(sampleNdjson);
    stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
    fs.unlinkSync(tmpFile);
  });

  it('prints human-readable stats by default', async () => {
    await runStats({ input: tmpFile, json: false });
    const output = (stdoutSpy.mock.calls[0][0] as string);
    expect(output).toContain('Total entries');
    expect(output).toContain('info');
    expect(output).toContain('error');
  });

  it('prints JSON stats when json option is true', async () => {
    await runStats({ input: tmpFile, json: true });
    const raw = (stdoutSpy.mock.calls[0][0] as string);
    const parsed = JSON.parse(raw);
    expect(parsed.total).toBe(4);
    expect(parsed.byLevel.info).toBe(2);
    expect(parsed.byLevel.warn).toBe(1);
    expect(parsed.byLevel.error).toBe(1);
  });

  it('includes correct time range in JSON output', async () => {
    await runStats({ input: tmpFile, json: true });
    const raw = (stdoutSpy.mock.calls[0][0] as string);
    const parsed = JSON.parse(raw);
    expect(parsed.earliest).toBe('2024-03-01T07:59:00Z');
    expect(parsed.latest).toBe('2024-03-01T08:02:00Z');
  });

  it('includes fields array in JSON output', async () => {
    await runStats({ input: tmpFile, json: true });
    const raw = (stdoutSpy.mock.calls[0][0] as string);
    const parsed = JSON.parse(raw);
    expect(Array.isArray(parsed.fields)).toBe(true);
    expect(parsed.fields).toContain('timestamp');
    expect(parsed.fields).toContain('level');
    expect(parsed.fields).toContain('message');
  });

  it('handles empty log file gracefully', async () => {
    const emptyFile = writeTempFile('');
    try {
      await runStats({ input: emptyFile, json: true });
      const raw = (stdoutSpy.mock.calls[0][0] as string);
      const parsed = JSON.parse(raw);
      expect(parsed.total).toBe(0);
    } finally {
      fs.unlinkSync(emptyFile);
    }
  });
});
