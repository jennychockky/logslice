import { LogEntry } from './parser';

export type OutputFormat = 'json' | 'pretty' | 'compact';

export interface FormatOptions {
  format: OutputFormat;
  colorize?: boolean;
  fields?: string[];
}

const LEVEL_COLORS: Record<string, string> = {
  error: '\x1b[31m',
  warn: '\x1b[33m',
  info: '\x1b[36m',
  debug: '\x1b[90m',
  trace: '\x1b[37m',
};

const RESET = '\x1b[0m';

function colorLevel(level: string, colorize: boolean): string {
  if (!colorize) return level;
  const color = LEVEL_COLORS[level.toLowerCase()] ?? '';
  return color ? `${color}${level}${RESET}` : level;
}

function pickFields(entry: LogEntry, fields?: string[]): Partial<LogEntry> {
  if (!fields || fields.length === 0) return entry;
  const result: Record<string, unknown> = {};
  for (const field of fields) {
    if (field in entry) {
      result[field] = (entry as Record<string, unknown>)[field];
    }
  }
  return result as Partial<LogEntry>;
}

export function formatEntry(entry: LogEntry, options: FormatOptions): string {
  const { format, colorize = false, fields } = options;
  const data = pickFields(entry, fields);

  switch (format) {
    case 'json':
      return JSON.stringify(data);

    case 'pretty': {
      const level = entry.level ? colorLevel(entry.level, colorize) : 'UNKNOWN';
      const timestamp = entry.timestamp ?? '';
      const message = entry.message ?? '';
      const rest = Object.entries(data)
        .filter(([k]) => !['timestamp', 'level', 'message'].includes(k))
        .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
        .join(' ');
      return `[${timestamp}] ${level}: ${message}${rest ? ' ' + rest : ''}`;
    }

    case 'compact':
      return JSON.stringify(data, null, 0);

    default:
      return JSON.stringify(data);
  }
}

export function formatEntries(entries: LogEntry[], options: FormatOptions): string[] {
  return entries.map((entry) => formatEntry(entry, options));
}
