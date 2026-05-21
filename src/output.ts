import * as fs from 'fs';
import * as path from 'path';
import { formatEntries } from './formatter';
import { LogEntry } from './parser';

export interface OutputOptions {
  outputPath?: string;
  pretty?: boolean;
  fields?: string[];
  colorize?: boolean;
}

export function writeToFile(filePath: string, content: string): void {
  const dir = path.dirname(filePath);
  if (dir && dir !== '.') {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content, 'utf-8');
}

export function entriesToNdjson(entries: LogEntry[]): string {
  return entries.map((e) => JSON.stringify(e)).join('\n');
}

export function entriesToPrettyJson(entries: LogEntry[]): string {
  return JSON.stringify(entries, null, 2);
}

export function outputEntries(
  entries: LogEntry[],
  options: OutputOptions = {}
): string {
  const { outputPath, pretty = false, fields, colorize = false } = options;

  let content: string;

  if (colorize) {
    content = formatEntries(entries, fields);
  } else if (pretty) {
    const projected = fields
      ? entries.map((e) => {
          const result: Record<string, unknown> = {};
          for (const f of fields) {
            if (f in e) result[f] = (e as Record<string, unknown>)[f];
          }
          return result;
        })
      : entries;
    content = entriesToPrettyJson(projected as LogEntry[]);
  } else {
    const projected = fields
      ? entries.map((e) => {
          const result: Record<string, unknown> = {};
          for (const f of fields) {
            if (f in e) result[f] = (e as Record<string, unknown>)[f];
          }
          return result;
        })
      : entries;
    content = entriesToNdjson(projected as LogEntry[]);
  }

  if (outputPath) {
    writeToFile(outputPath, content + '\n');
  }

  return content;
}
