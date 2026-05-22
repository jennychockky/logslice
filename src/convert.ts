import { LogEntry } from './parser';

export type ConvertFormat = 'csv' | 'tsv' | 'jsonarray';

export interface ConvertOptions {
  format: ConvertFormat;
  fields?: string[];
  includeHeader?: boolean;
}

function getFields(entries: LogEntry[], fields?: string[]): string[] {
  if (fields && fields.length > 0) return fields;
  const keys = new Set<string>();
  for (const entry of entries) {
    Object.keys(entry).forEach(k => keys.add(k));
  }
  return Array.from(keys);
}

function escapeDelimited(value: unknown, delimiter: string): string {
  const str = value === null || value === undefined ? '' : String(value);
  const needsQuote = str.includes(delimiter) || str.includes('"') || str.includes('\n');
  if (needsQuote) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

export function entriesToDelimited(
  entries: LogEntry[],
  delimiter: string,
  fields?: string[],
  includeHeader = true
): string {
  const cols = getFields(entries, fields);
  const rows: string[] = [];
  if (includeHeader) {
    rows.push(cols.map(c => escapeDelimited(c, delimiter)).join(delimiter));
  }
  for (const entry of entries) {
    const row = cols.map(col => escapeDelimited((entry as Record<string, unknown>)[col], delimiter));
    rows.push(row.join(delimiter));
  }
  return rows.join('\n');
}

export function entriesToJsonArray(entries: LogEntry[]): string {
  return JSON.stringify(entries, null, 2);
}

export function convertEntries(entries: LogEntry[], options: ConvertOptions): string {
  switch (options.format) {
    case 'csv':
      return entriesToDelimited(entries, ',', options.fields, options.includeHeader ?? true);
    case 'tsv':
      return entriesToDelimited(entries, '\t', options.fields, options.includeHeader ?? true);
    case 'jsonarray':
      return entriesToJsonArray(entries);
    default:
      throw new Error(`Unknown format: ${options.format}`);
  }
}
