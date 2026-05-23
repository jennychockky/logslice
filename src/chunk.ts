import { LogEntry } from './parser';

export interface ChunkOptions {
  size?: number;
  field?: string;
  maxChunks?: number;
}

/**
 * Split entries into fixed-size chunks.
 */
export function chunkBySize(entries: LogEntry[], size: number): LogEntry[][] {
  if (size <= 0) throw new Error('Chunk size must be greater than 0');
  const chunks: LogEntry[][] = [];
  for (let i = 0; i < entries.length; i += size) {
    chunks.push(entries.slice(i, i + size));
  }
  return chunks;
}

/**
 * Split entries into groups by a field value.
 */
export function chunkByField(entries: LogEntry[], field: string): Map<string, LogEntry[]> {
  const map = new Map<string, LogEntry[]>();
  for (const entry of entries) {
    const key = entry[field] !== undefined ? String(entry[field]) : '__undefined__';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(entry);
  }
  return map;
}

/**
 * Apply chunk options and return array of chunks.
 */
export function chunkEntries(entries: LogEntry[], options: ChunkOptions): LogEntry[][] {
  let chunks: LogEntry[][];

  if (options.field) {
    const grouped = chunkByField(entries, options.field);
    chunks = Array.from(grouped.values());
  } else if (options.size && options.size > 0) {
    chunks = chunkBySize(entries, options.size);
  } else {
    chunks = [entries];
  }

  if (options.maxChunks && options.maxChunks > 0) {
    chunks = chunks.slice(0, options.maxChunks);
  }

  return chunks;
}
