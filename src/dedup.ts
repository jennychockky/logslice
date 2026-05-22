/**
 * Deduplication utilities for log entries.
 * Removes duplicate log entries based on configurable key fields.
 */

export interface DedupOptions {
  /** Fields to use as the deduplication key. Defaults to ['message', 'level'] */
  keyFields?: string[];
  /** If true, keep the last occurrence instead of the first */
  keepLast?: boolean;
}

const DEFAULT_KEY_FIELDS = ['message', 'level'];

/**
 * Builds a string key from a log entry based on the specified fields.
 */
export function buildDedupKey(
  entry: Record<string, unknown>,
  keyFields: string[]
): string {
  return keyFields
    .map((field) => {
      const val = entry[field];
      return val !== undefined ? String(val) : '';
    })
    .join('\x00');
}

/**
 * Deduplicates an array of log entries.
 * Returns a new array with duplicates removed.
 */
export function deduplicateEntries(
  entries: Record<string, unknown>[],
  options: DedupOptions = {}
): Record<string, unknown>[] {
  const keyFields = options.keyFields ?? DEFAULT_KEY_FIELDS;
  const keepLast = options.keepLast ?? false;

  const seen = new Map<string, number>();
  const result: Record<string, unknown>[] = [];

  if (keepLast) {
    // Process in reverse, collect indices to keep
    const keepIndices = new Set<number>();
    for (let i = entries.length - 1; i >= 0; i--) {
      const key = buildDedupKey(entries[i], keyFields);
      if (!seen.has(key)) {
        seen.set(key, i);
        keepIndices.add(i);
      }
    }
    return entries.filter((_, idx) => keepIndices.has(idx));
  }

  for (const entry of entries) {
    const key = buildDedupKey(entry, keyFields);
    if (!seen.has(key)) {
      seen.set(key, result.length);
      result.push(entry);
    }
  }

  return result;
}

/**
 * Returns the count of duplicate entries that would be removed.
 */
export function countDuplicates(
  entries: Record<string, unknown>[],
  options: DedupOptions = {}
): number {
  const keyFields = options.keyFields ?? DEFAULT_KEY_FIELDS;
  const seen = new Set<string>();
  let duplicates = 0;
  for (const entry of entries) {
    const key = buildDedupKey(entry, keyFields);
    if (seen.has(key)) {
      duplicates++;
    } else {
      seen.add(key);
    }
  }
  return duplicates;
}
