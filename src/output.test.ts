import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { outputEntries, entriesToNdjson, entriesToPrettyJson, writeToFile } from './output';
import { LogEntry } from './parser';

const sampleEntries: LogEntry[] = [
  { timestamp: '2024-01-01T10:00:00.000Z', level: 'info', message: 'Server started', service: 'api' },
  { timestamp: '2024-01-01T10:01:00.000Z', level: 'error', message: 'Connection failed', service: 'db' },
];

describe('entriesToNdjson', () => {
  it('converts entries to newline-delimited JSON', () => {
    const result = entriesToNdjson(sampleEntries);
    const lines = result.split('\n');
    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0])).toEqual(sampleEntries[0]);
    expect(JSON.parse(lines[1])).toEqual(sampleEntries[1]);
  });

  it('returns empty string for empty array', () => {
    expect(entriesToNdjson([])).toBe('');
  });
});

describe('entriesToPrettyJson', () => {
  it('returns formatted JSON array', () => {
    const result = entriesToPrettyJson(sampleEntries);
    const parsed = JSON.parse(result);
    expect(parsed).toEqual(sampleEntries);
    expect(result).toContain('\n');
  });
});

describe('writeToFile', () => {
  it('writes content to a file', () => {
    const tmpDir = os.tmpdir();
    const filePath = path.join(tmpDir, 'logslice-test-output.log');
    writeToFile(filePath, 'hello world');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toBe('hello world');
    fs.unlinkSync(filePath);
  });

  it('creates nested directories if needed', () => {
    const tmpDir = os.tmpdir();
    const filePath = path.join(tmpDir, 'logslice-nested', 'deep', 'output.log');
    writeToFile(filePath, 'nested content');
    expect(fs.existsSync(filePath)).toBe(true);
    fs.rmSync(path.join(tmpDir, 'logslice-nested'), { recursive: true });
  });
});

describe('outputEntries', () => {
  it('returns ndjson by default', () => {
    const result = outputEntries(sampleEntries);
    const lines = result.split('\n').filter(Boolean);
    expect(lines).toHaveLength(2);
  });

  it('returns pretty json when pretty=true', () => {
    const result = outputEntries(sampleEntries, { pretty: true });
    const parsed = JSON.parse(result);
    expect(parsed).toHaveLength(2);
  });

  it('projects only requested fields', () => {
    const result = outputEntries(sampleEntries, { fields: ['level', 'message'] });
    const lines = result.split('\n').filter(Boolean);
    const first = JSON.parse(lines[0]);
    expect(first).toHaveProperty('level');
    expect(first).toHaveProperty('message');
    expect(first).not.toHaveProperty('timestamp');
  });

  it('writes to file when outputPath is provided', () => {
    const tmpDir = os.tmpdir();
    const filePath = path.join(tmpDir, 'logslice-entries-test.log');
    outputEntries(sampleEntries, { outputPath: filePath });
    expect(fs.existsSync(filePath)).toBe(true);
    fs.unlinkSync(filePath);
  });
});
