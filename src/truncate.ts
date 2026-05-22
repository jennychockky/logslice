/**
 * Truncation utilities for log entry field values.
 * Allows capping string/array field lengths for cleaner output.
 */

export interface TruncateOptions {
  maxLength?: number;       // max chars for string values
  maxArrayItems?: number;   // max items for array values
  ellipsis?: string;        // suffix when truncated (default: '...')
}

const DEFAULT_ELLIPSIS = '...';

export function truncateString(
  value: string,
  maxLength: number,
  ellipsis: string = DEFAULT_ELLIPSIS
): string {
  if (value.length <= maxLength) return value;
  return value.slice(0, Math.max(0, maxLength - ellipsis.length)) + ellipsis;
}

export function truncateArray(
  value: unknown[],
  maxItems: number
): unknown[] {
  if (value.length <= maxItems) return value;
  return value.slice(0, maxItems);
}

export function truncateFieldValue(
  value: unknown,
  options: TruncateOptions
): unknown {
  const ellipsis = options.ellipsis ?? DEFAULT_ELLIPSIS;
  if (typeof value === 'string' && options.maxLength !== undefined) {
    return truncateString(value, options.maxLength, ellipsis);
  }
  if (Array.isArray(value) && options.maxArrayItems !== undefined) {
    return truncateArray(value, options.maxArrayItems);
  }
  return value;
}

export function truncateEntry(
  entry: Record<string, unknown>,
  fields: string[],
  options: TruncateOptions
): Record<string, unknown> {
  if (fields.length === 0) return entry;
  const result: Record<string, unknown> = { ...entry };
  for (const field of fields) {
    if (Object.prototype.hasOwnProperty.call(result, field)) {
      result[field] = truncateFieldValue(result[field], options);
    }
  }
  return result;
}

export function truncateEntries(
  entries: Record<string, unknown>[],
  fields: string[],
  options: TruncateOptions
): Record<string, unknown>[] {
  return entries.map((e) => truncateEntry(e, fields, options));
}
