/**
 * Enrich log entries with derived or static fields.
 */

export interface EnrichOptions {
  staticFields?: Record<string, unknown>;
  addTimestamp?: boolean;
  timestampField?: string;
  addIndex?: boolean;
  indexField?: string;
}

export type LogEntry = Record<string, unknown>;

export function enrichWithStatic(
  entry: LogEntry,
  staticFields: Record<string, unknown>
): LogEntry {
  return { ...entry, ...staticFields };
}

export function enrichWithTimestamp(
  entry: LogEntry,
  field = "_enriched_at"
): LogEntry {
  return { ...entry, [field]: new Date().toISOString() };
}

export function enrichWithIndex(
  entry: LogEntry,
  index: number,
  field = "_index"
): LogEntry {
  return { ...entry, [field]: index };
}

export function enrichEntry(
  entry: LogEntry,
  index: number,
  options: EnrichOptions
): LogEntry {
  let result = { ...entry };

  if (options.staticFields && Object.keys(options.staticFields).length > 0) {
    result = enrichWithStatic(result, options.staticFields);
  }

  if (options.addTimestamp) {
    result = enrichWithTimestamp(result, options.timestampField);
  }

  if (options.addIndex) {
    result = enrichWithIndex(result, index, options.indexField);
  }

  return result;
}

export function enrichEntries(
  entries: LogEntry[],
  options: EnrichOptions
): LogEntry[] {
  return entries.map((entry, i) => enrichEntry(entry, i, options));
}
