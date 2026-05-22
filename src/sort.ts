import { LogEntry } from './parser';

export type SortField = 'timestamp' | 'level' | string;
export type SortOrder = 'asc' | 'desc';

export interface SortOptions {
  field: SortField;
  order: SortOrder;
}

const LEVEL_ORDER: Record<string, number> = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
  fatal: 5,
};

function getFieldValue(entry: LogEntry, field: SortField): unknown {
  if (field === 'timestamp') {
    return entry.timestamp instanceof Date ? entry.timestamp.getTime() : 0;
  }
  return (entry as Record<string, unknown>)[field] ?? entry.raw[field];
}

function compareValues(a: unknown, b: unknown, field: SortField): number {
  if (field === 'level') {
    const aLevel = typeof a === 'string' ? (LEVEL_ORDER[a.toLowerCase()] ?? -1) : -1;
    const bLevel = typeof b === 'string' ? (LEVEL_ORDER[b.toLowerCase()] ?? -1) : -1;
    return aLevel - bLevel;
  }

  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }

  const aStr = String(a ?? '');
  const bStr = String(b ?? '');
  return aStr.localeCompare(bStr);
}

export function sortEntries(entries: LogEntry[], options: SortOptions): LogEntry[] {
  const { field, order } = options;
  const sorted = [...entries].sort((a, b) => {
    const aVal = getFieldValue(a, field);
    const bVal = getFieldValue(b, field);
    const cmp = compareValues(aVal, bVal, field);
    return order === 'desc' ? -cmp : cmp;
  });
  return sorted;
}

export function parseSortOption(raw: string): SortOptions {
  const parts = raw.split(':');
  const field = parts[0]?.trim();
  const orderRaw = parts[1]?.trim().toLowerCase();

  if (!field) {
    throw new Error(`Invalid sort option: "${raw}". Expected format: field[:asc|desc]`);
  }

  const order: SortOrder = orderRaw === 'desc' ? 'desc' : 'asc';
  return { field, order };
}
