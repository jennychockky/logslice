import { LogEntry } from './parser';

export interface FilterOptions {
  from?: Date;
  to?: Date;
  fields?: Record<string, string | RegExp>;
  level?: string | string[];
}

export function filterByTimeRange(
  entries: LogEntry[],
  from?: Date,
  to?: Date
): LogEntry[] {
  return entries.filter((entry) => {
    if (!entry.timestamp) return false;
    const ts = new Date(entry.timestamp);
    if (from && ts < from) return false;
    if (to && ts > to) return false;
    return true;
  });
}

export function filterByFields(
  entries: LogEntry[],
  fields: Record<string, string | RegExp>
): LogEntry[] {
  return entries.filter((entry) => {
    return Object.entries(fields).every(([key, pattern]) => {
      const value = entry[key];
      if (value === undefined || value === null) return false;
      const strValue = String(value);
      if (pattern instanceof RegExp) {
        return pattern.test(strValue);
      }
      return strValue === pattern;
    });
  });
}

export function filterByLevel(
  entries: LogEntry[],
  level: string | string[]
): LogEntry[] {
  const levels = Array.isArray(level)
    ? level.map((l) => l.toLowerCase())
    : [level.toLowerCase()];
  return entries.filter((entry) => {
    const entryLevel = (entry.level ?? entry.severity ?? '');
    return levels.includes(String(entryLevel).toLowerCase());
  });
}

export function applyFilters(
  entries: LogEntry[],
  options: FilterOptions
): LogEntry[] {
  let result = entries;
  if (options.from || options.to) {
    result = filterByTimeRange(result, options.from, options.to);
  }
  if (options.fields && Object.keys(options.fields).length > 0) {
    result = filterByFields(result, options.fields);
  }
  if (options.level) {
    result = filterByLevel(result, options.level);
  }
  return result;
}
