import { LogEntry } from './parser';

export interface DiffResult {
  added: LogEntry[];
  removed: LogEntry[];
  common: LogEntry[];
}

export interface DiffOptions {
  keyFields?: string[];
  ignoreFields?: string[];
}

function buildEntryKey(entry: LogEntry, keyFields?: string[]): string {
  if (keyFields && keyFields.length > 0) {
    const parts = keyFields.map((f) => String(entry[f] ?? ''));
    return parts.join('|');
  }
  // Default: use all fields except timestamp variance
  const { timestamp: _ts, ...rest } = entry as Record<string, unknown>;
  return JSON.stringify(rest, Object.keys(rest).sort());
}

function stripIgnored(
  entry: LogEntry,
  ignoreFields?: string[]
): LogEntry {
  if (!ignoreFields || ignoreFields.length === 0) return entry;
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(entry as Record<string, unknown>)) {
    if (!ignoreFields.includes(k)) result[k] = v;
  }
  return result as LogEntry;
}

export function diffEntries(
  base: LogEntry[],
  compare: LogEntry[],
  options: DiffOptions = {}
): DiffResult {
  const { keyFields, ignoreFields } = options;

  const baseMap = new Map<string, LogEntry>();
  for (const entry of base) {
    const cleaned = stripIgnored(entry, ignoreFields);
    const key = buildEntryKey(cleaned, keyFields);
    baseMap.set(key, entry);
  }

  const compareMap = new Map<string, LogEntry>();
  for (const entry of compare) {
    const cleaned = stripIgnored(entry, ignoreFields);
    const key = buildEntryKey(cleaned, keyFields);
    compareMap.set(key, entry);
  }

  const added: LogEntry[] = [];
  const removed: LogEntry[] = [];
  const common: LogEntry[] = [];

  for (const [key, entry] of compareMap) {
    if (baseMap.has(key)) {
      common.push(entry);
    } else {
      added.push(entry);
    }
  }

  for (const [key, entry] of baseMap) {
    if (!compareMap.has(key)) {
      removed.push(entry);
    }
  }

  return { added, removed, common };
}

export function formatDiffSummary(result: DiffResult): string {
  const lines: string[] = [
    `Diff summary:`,
    `  Added:   ${result.added.length}`,
    `  Removed: ${result.removed.length}`,
    `  Common:  ${result.common.length}`,
  ];
  return lines.join('\n');
}
