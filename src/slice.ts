import { LogEntry } from './parser';

export interface SliceOptions {
  head?: number;
  tail?: number;
  skip?: number;
  limit?: number;
}

/**
 * Returns the first `n` entries.
 */
export function sliceHead(entries: LogEntry[], n: number): LogEntry[] {
  if (n <= 0) return [];
  return entries.slice(0, n);
}

/**
 * Returns the last `n` entries.
 */
export function sliceTail(entries: LogEntry[], n: number): LogEntry[] {
  if (n <= 0) return [];
  return entries.slice(-n);
}

/**
 * Skips the first `skip` entries then takes up to `limit` entries.
 */
export function sliceRange(
  entries: LogEntry[],
  skip: number,
  limit: number
): LogEntry[] {
  const start = Math.max(0, skip);
  const end = limit > 0 ? start + limit : entries.length;
  return entries.slice(start, end);
}

/**
 * Applies SliceOptions to an array of entries.
 * Priority: head > tail > skip/limit.
 */
export function sliceEntries(
  entries: LogEntry[],
  options: SliceOptions
): LogEntry[] {
  if (options.head !== undefined) {
    return sliceHead(entries, options.head);
  }
  if (options.tail !== undefined) {
    return sliceTail(entries, options.tail);
  }
  const skip = options.skip ?? 0;
  const limit = options.limit ?? 0;
  if (skip > 0 || limit > 0) {
    return sliceRange(entries, skip, limit);
  }
  return entries;
}
