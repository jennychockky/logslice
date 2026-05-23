import { chunkBySize, chunkByField, chunkEntries } from './chunk';
import { LogEntry } from './parser';

function makeEntry(overrides: Record<string, unknown> = {}): LogEntry {
  return { timestamp: '2024-01-01T00:00:00Z', level: 'info', message: 'test', ...overrides };
}

describe('chunkBySize', () => {
  it('splits entries into fixed-size chunks', () => {
    const entries = [makeEntry(), makeEntry(), makeEntry(), makeEntry(), makeEntry()];
    const result = chunkBySize(entries, 2);
    expect(result).toHaveLength(3);
    expect(result[0]).toHaveLength(2);
    expect(result[1]).toHaveLength(2);
    expect(result[2]).toHaveLength(1);
  });

  it('returns single chunk when size >= entries length', () => {
    const entries = [makeEntry(), makeEntry()];
    expect(chunkBySize(entries, 10)).toHaveLength(1);
  });

  it('throws on size <= 0', () => {
    expect(() => chunkBySize([], 0)).toThrow('Chunk size must be greater than 0');
  });

  it('returns empty array for empty input', () => {
    expect(chunkBySize([], 3)).toHaveLength(0);
  });
});

describe('chunkByField', () => {
  it('groups entries by field value', () => {
    const entries = [
      makeEntry({ service: 'api' }),
      makeEntry({ service: 'worker' }),
      makeEntry({ service: 'api' }),
    ];
    const result = chunkByField(entries, 'service');
    expect(result.get('api')).toHaveLength(2);
    expect(result.get('worker')).toHaveLength(1);
  });

  it('groups missing field under __undefined__', () => {
    const entries = [makeEntry(), makeEntry({ service: 'api' })];
    const result = chunkByField(entries, 'service');
    expect(result.get('__undefined__')).toHaveLength(1);
  });
});

describe('chunkEntries', () => {
  it('chunks by size option', () => {
    const entries = Array.from({ length: 6 }, () => makeEntry());
    const result = chunkEntries(entries, { size: 3 });
    expect(result).toHaveLength(2);
  });

  it('chunks by field option', () => {
    const entries = [
      makeEntry({ env: 'prod' }),
      makeEntry({ env: 'dev' }),
      makeEntry({ env: 'prod' }),
    ];
    const result = chunkEntries(entries, { field: 'env' });
    expect(result).toHaveLength(2);
  });

  it('respects maxChunks', () => {
    const entries = Array.from({ length: 10 }, () => makeEntry());
    const result = chunkEntries(entries, { size: 2, maxChunks: 3 });
    expect(result).toHaveLength(3);
  });

  it('returns single chunk with no options', () => {
    const entries = [makeEntry(), makeEntry()];
    const result = chunkEntries(entries, {});
    expect(result).toHaveLength(1);
  });
});
