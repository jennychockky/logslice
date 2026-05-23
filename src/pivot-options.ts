import { PivotOptions } from './pivot';

export interface PivotCliOptions extends PivotOptions {
  inputFile?: string;
  outputFile?: string;
}

export function validatePivotOptions(opts: Partial<PivotCliOptions>): string[] {
  const errors: string[] = [];
  if (!opts.rowField) errors.push('--row is required');
  if (!opts.colField) errors.push('--col is required');
  if (opts.aggFn && !['count', 'sum', 'avg'].includes(opts.aggFn)) {
    errors.push(`--agg must be one of: count, sum, avg (got "${opts.aggFn}")`);
  }
  if ((opts.aggFn === 'sum' || opts.aggFn === 'avg') && !opts.valueField) {
    errors.push(`--value is required when --agg is "${opts.aggFn}"`);
  }
  return errors;
}

export function describePivotOptions(opts: PivotCliOptions): string {
  const parts = [`row=${opts.rowField}`, `col=${opts.colField}`];
  if (opts.valueField) parts.push(`value=${opts.valueField}`);
  if (opts.aggFn) parts.push(`agg=${opts.aggFn}`);
  return `pivot(${parts.join(', ')})`;
}

export function mergePivotOptions(
  base: Partial<PivotCliOptions>,
  overrides: Partial<PivotCliOptions>
): Partial<PivotCliOptions> {
  return { ...base, ...overrides };
}
