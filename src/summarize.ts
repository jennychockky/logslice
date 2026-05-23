import { LogEntry } from "./parser";

export interface SummaryOptions {
  topN?: number;
  countField?: string;
}

export interface FieldSummary {
  field: string;
  uniqueValues: number;
  topValues: Array<{ value: string; count: number }>;
}

export interface LogSummary {
  totalEntries: number;
  fields: string[];
  fieldSummaries: FieldSummary[];
  timeRange?: { earliest: string; latest: string };
}

export function collectFields(entries: LogEntry[]): string[] {
  const fieldSet = new Set<string>();
  for (const entry of entries) {
    for (const key of Object.keys(entry)) {
      fieldSet.add(key);
    }
  }
  return Array.from(fieldSet).sort();
}

export function summarizeField(
  entries: LogEntry[],
  field: string,
  topN = 5
): FieldSummary {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    const val = entry[field];
    if (val !== undefined && val !== null) {
      const key = String(val);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  const sorted = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([value, count]) => ({ value, count }));
  return { field, uniqueValues: counts.size, topValues: sorted };
}

export function getTimeRange(
  entries: LogEntry[]
): { earliest: string; latest: string } | undefined {
  const timestamps = entries
    .map((e) => e["timestamp"] ?? e["time"] ?? e["@timestamp"])
    .filter((t): t is string => typeof t === "string")
    .sort();
  if (timestamps.length === 0) return undefined;
  return { earliest: timestamps[0], latest: timestamps[timestamps.length - 1] };
}

export function summarizeEntries(
  entries: LogEntry[],
  options: SummaryOptions = {}
): LogSummary {
  const topN = options.topN ?? 5;
  const fields = collectFields(entries);
  const fieldSummaries = fields.map((f) => summarizeField(entries, f, topN));
  const timeRange = getTimeRange(entries);
  return {
    totalEntries: entries.length,
    fields,
    fieldSummaries,
    timeRange,
  };
}

export function formatSummary(summary: LogSummary): string {
  const lines: string[] = [
    `Total entries : ${summary.totalEntries}`,
    `Fields (${summary.fields.length}): ${summary.fields.join(", ")}`,
  ];
  if (summary.timeRange) {
    lines.push(
      `Time range    : ${summary.timeRange.earliest} → ${summary.timeRange.latest}`
    );
  }
  for (const fs of summary.fieldSummaries) {
    lines.push(`\n  [${fs.field}] — ${fs.uniqueValues} unique value(s)`);
    for (const { value, count } of fs.topValues) {
      lines.push(`    ${String(count).padStart(6)}  ${value}`);
    }
  }
  return lines.join("\n");
}
