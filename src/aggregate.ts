import { LogEntry } from "./parser";

export interface AggregateOptions {
  groupBy: string;
  countField?: string;
  sumField?: string;
}

export interface AggregateResult {
  group: string;
  count: number;
  sum?: number;
  entries: LogEntry[];
}

export function groupEntries(
  entries: LogEntry[],
  groupBy: string
): Map<string, LogEntry[]> {
  const groups = new Map<string, LogEntry[]>();
  for (const entry of entries) {
    const key = String(entry[groupBy] ?? "__undefined__");
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(entry);
  }
  return groups;
}

export function aggregateEntries(
  entries: LogEntry[],
  options: AggregateOptions
): AggregateResult[] {
  const groups = groupEntries(entries, options.groupBy);
  const results: AggregateResult[] = [];

  for (const [group, groupEntries] of groups) {
    const result: AggregateResult = {
      group,
      count: groupEntries.length,
      entries: groupEntries,
    };

    if (options.sumField) {
      result.sum = groupEntries.reduce((acc, entry) => {
        const val = entry[options.sumField!];
        return acc + (typeof val === "number" ? val : 0);
      }, 0);
    }

    results.push(result);
  }

  return results.sort((a, b) => b.count - a.count);
}

export function formatAggregateResults(results: AggregateResult[], sumField?: string): string {
  const lines: string[] = [];
  for (const result of results) {
    let line = `${result.group}: ${result.count} entries`;
    if (sumField !== undefined && result.sum !== undefined) {
      line += `, sum(${sumField})=${result.sum}`;
    }
    lines.push(line);
  }
  return lines.join("\n");
}
