import { LogEntry } from './parser';

export interface MergeOptions {
  sortField?: string;
  dedup?: boolean;
  dedupFields?: string[];
}

/**
 * Merges multiple arrays of log entries into a single array.
 * Optionally sorts by a field and deduplicates.
 */
export function mergeEntries(
  sources: LogEntry[][],
  options: MergeOptions = {}
): LogEntry[] {
  const combined: LogEntry[] = ([] as LogEntry[]).concat(...sources);

  if (options.sortField) {
    const field = options.sortField;
    combined.sort((a, b) => {
      const av = a[field];
      const bv = b[field];
      if (av === undefined && bv === undefined) return 0;
      if (av === undefined) return 1;
      if (bv === undefined) return -1;
      if (av < bv) return -1;
      if (av > bv) return 1;
      return 0;
    });
  }

  if (options.dedup) {
    return deduplicateMerged(combined, options.dedupFields);
  }

  return combined;
}

function deduplicateMerged(
  entries: LogEntry[],
  fields?: string[]
): LogEntry[] {
  const seen = new Set<string>();
  const result: LogEntry[] = [];

  for (const entry of entries) {
    const key = buildKey(entry, fields);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(entry);
    }
  }

  return result;
}

function buildKey(entry: LogEntry, fields?: string[]): string {
  if (fields && fields.length > 0) {
    const subset: Record<string, unknown> = {};
    for (const f of fields) {
      subset[f] = entry[f];
    }
    return JSON.stringify(subset);
  }
  return JSON.stringify(entry);
}
