import { LogEntry } from './parser';

export interface PivotOptions {
  rowField: string;
  colField: string;
  valueField?: string;
  aggFn?: 'count' | 'sum' | 'avg';
}

export interface PivotResult {
  rows: string[];
  cols: string[];
  data: Record<string, Record<string, number>>;
}

export function getFieldStr(entry: LogEntry, field: string): string {
  const val = entry[field];
  if (val === undefined || val === null) return '(null)';
  return String(val);
}

export function getFieldNum(entry: LogEntry, field: string): number {
  const val = entry[field];
  return typeof val === 'number' ? val : 1;
}

export function pivotEntries(entries: LogEntry[], opts: PivotOptions): PivotResult {
  const { rowField, colField, valueField, aggFn = 'count' } = opts;
  const rowSet = new Set<string>();
  const colSet = new Set<string>();
  const sums: Record<string, Record<string, number>> = {};
  const counts: Record<string, Record<string, number>> = {};

  for (const entry of entries) {
    const row = getFieldStr(entry, rowField);
    const col = getFieldStr(entry, colField);
    const val = valueField ? getFieldNum(entry, valueField) : 1;
    rowSet.add(row);
    colSet.add(col);
    if (!sums[row]) sums[row] = {};
    if (!counts[row]) counts[row] = {};
    sums[row][col] = (sums[row][col] ?? 0) + val;
    counts[row][col] = (counts[row][col] ?? 0) + 1;
  }

  const rows = Array.from(rowSet).sort();
  const cols = Array.from(colSet).sort();
  const data: Record<string, Record<string, number>> = {};

  for (const row of rows) {
    data[row] = {};
    for (const col of cols) {
      const s = sums[row]?.[col] ?? 0;
      const c = counts[row]?.[col] ?? 0;
      if (aggFn === 'count') data[row][col] = c;
      else if (aggFn === 'sum') data[row][col] = s;
      else if (aggFn === 'avg') data[row][col] = c > 0 ? s / c : 0;
    }
  }

  return { rows, cols, data };
}

export function formatPivotTable(result: PivotResult): string {
  const { rows, cols, data } = result;
  const colWidth = 12;
  const rowWidth = 20;
  const header = ''.padEnd(rowWidth) + cols.map(c => c.padStart(colWidth)).join('');
  const lines = [header];
  for (const row of rows) {
    const cells = cols.map(col => String(data[row]?.[col] ?? 0).padStart(colWidth));
    lines.push(row.padEnd(rowWidth) + cells.join(''));
  }
  return lines.join('\n');
}
