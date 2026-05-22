/**
 * Flatten nested JSON log entries into dot-notation keys.
 */

export type LogEntry = Record<string, unknown>;

/**
 * Recursively flattens a nested object into dot-notation keys.
 * e.g. { a: { b: 1 } } => { 'a.b': 1 }
 */
export function flattenObject(
  obj: Record<string, unknown>,
  prefix = "",
  separator = "."
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}${separator}${key}` : key;

    if (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      const nested = flattenObject(
        value as Record<string, unknown>,
        fullKey,
        separator
      );
      Object.assign(result, nested);
    } else {
      result[fullKey] = value;
    }
  }

  return result;
}

/**
 * Flattens a single log entry.
 */
export function flattenEntry(
  entry: LogEntry,
  separator = "."
): LogEntry {
  return flattenObject(entry, "", separator);
}

/**
 * Flattens an array of log entries.
 */
export function flattenEntries(
  entries: LogEntry[],
  separator = "."
): LogEntry[] {
  return entries.map((e) => flattenEntry(e, separator));
}

/**
 * Unflattens a dot-notation object back into a nested object.
 */
export function unflattenObject(
  obj: Record<string, unknown>,
  separator = "."
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const parts = key.split(separator);
    let current = result;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current) || typeof current[part] !== "object") {
        current[part] = {};
      }
      current = current[part] as Record<string, unknown>;
    }

    current[parts[parts.length - 1]] = value;
  }

  return result;
}
