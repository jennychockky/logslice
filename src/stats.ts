import { LogEntry } from './parser';

export interface LogStats {
  total: number;
  byLevel: Record<string, number>;
  earliest: string | null;
  latest: string | null;
  fields: Set<string>;
}

export function computeStats(entries: LogEntry[]): LogStats {
  const byLevel: Record<string, number> = {};
  let earliest: string | null = null;
  let latest: string | null = null;
  const fields = new Set<string>();

  for (const entry of entries) {
    // Count by level
    const level = String(entry.level ?? 'unknown');
    byLevel[level] = (byLevel[level] ?? 0) + 1;

    // Track time range
    const ts = entry.timestamp;
    if (ts) {
      if (earliest === null || ts < earliest) earliest = ts;
      if (latest === null || ts > latest) latest = ts;
    }

    // Collect all field names
    for (const key of Object.keys(entry)) {
      fields.add(key);
    }
  }

  return { total: entries.length, byLevel, earliest, latest, fields };
}

export function formatStats(stats: LogStats): string {
  const lines: string[] = [
    `Total entries : ${stats.total}`,
    `Time range    : ${stats.earliest ?? 'N/A'} → ${stats.latest ?? 'N/A'}`,
    'Levels:',
  ];

  for (const [level, count] of Object.entries(stats.byLevel).sort()) {
    lines.push(`  ${level.padEnd(10)} ${count}`);
  }

  lines.push(`Fields        : ${[...stats.fields].sort().join(', ')}`);

  return lines.join('\n');
}
