/**
 * transform.ts — Field transformation utilities for log entries.
 * Supports renaming, redacting, and projecting fields on parsed log entries.
 */

export interface TransformOptions {
  rename?: Record<string, string>;
  redact?: string[];
  pick?: string[];
  omit?: string[];
}

export type LogEntry = Record<string, unknown>;

/**
 * Rename fields in a log entry according to a mapping.
 */
export function renameFields(entry: LogEntry, rename: Record<string, string>): LogEntry {
  const result: LogEntry = { ...entry };
  for (const [from, to] of Object.entries(rename)) {
    if (Object.prototype.hasOwnProperty.call(result, from)) {
      result[to] = result[from];
      delete result[from];
    }
  }
  return result;
}

/**
 * Redact specified fields by replacing their values with "[REDACTED]".
 */
export function redactFields(entry: LogEntry, fields: string[]): LogEntry {
  const result: LogEntry = { ...entry };
  for (const field of fields) {
    if (Object.prototype.hasOwnProperty.call(result, field)) {
      result[field] = "[REDACTED]";
    }
  }
  return result;
}

/**
 * Pick only the specified fields from a log entry.
 */
export function pickFields(entry: LogEntry, fields: string[]): LogEntry {
  const result: LogEntry = {};
  for (const field of fields) {
    if (Object.prototype.hasOwnProperty.call(entry, field)) {
      result[field] = entry[field];
    }
  }
  return result;
}

/**
 * Omit specified fields from a log entry.
 */
export function omitFields(entry: LogEntry, fields: string[]): LogEntry {
  const result: LogEntry = { ...entry };
  for (const field of fields) {
    delete result[field];
  }
  return result;
}

/**
 * Apply a full set of transformations to a single log entry.
 */
export function transformEntry(entry: LogEntry, options: TransformOptions): LogEntry {
  let result = { ...entry };
  if (options.pick && options.pick.length > 0) {
    result = pickFields(result, options.pick);
  }
  if (options.omit && options.omit.length > 0) {
    result = omitFields(result, options.omit);
  }
  if (options.rename && Object.keys(options.rename).length > 0) {
    result = renameFields(result, options.rename);
  }
  if (options.redact && options.redact.length > 0) {
    result = redactFields(result, options.redact);
  }
  return result;
}

/**
 * Apply transformations to an array of log entries.
 */
export function transformEntries(entries: LogEntry[], options: TransformOptions): LogEntry[] {
  return entries.map((entry) => transformEntry(entry, options));
}
