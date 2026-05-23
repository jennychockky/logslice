/**
 * mask.ts — Mask sensitive field values in log entries
 */

import { LogEntry } from './parser';

export interface MaskOptions {
  fields: string[];
  maskChar?: string;
  maskLength?: number;
  showLast?: number;
}

export function maskValue(
  value: unknown,
  maskChar = '*',
  maskLength?: number,
  showLast = 0
): string {
  const str = typeof value === 'string' ? value : JSON.stringify(value);
  if (showLast > 0 && str.length > showLast) {
    const visible = str.slice(-showLast);
    const hidden = maskChar.repeat(maskLength ?? str.length - showLast);
    return hidden + visible;
  }
  return maskChar.repeat(maskLength ?? str.length);
}

export function maskEntry(entry: LogEntry, options: MaskOptions): LogEntry {
  const { fields, maskChar = '*', maskLength, showLast = 0 } = options;
  const result: LogEntry = { ...entry };
  for (const field of fields) {
    if (field in result) {
      result[field] = maskValue(result[field], maskChar, maskLength, showLast);
    }
  }
  return result;
}

export function maskEntries(entries: LogEntry[], options: MaskOptions): LogEntry[] {
  return entries.map((entry) => maskEntry(entry, options));
}

export function parseMaskFields(raw: string): string[] {
  return raw
    .split(',')
    .map((f) => f.trim())
    .filter((f) => f.length > 0);
}
