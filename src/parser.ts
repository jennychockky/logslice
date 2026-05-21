/**
 * Parses and validates raw log lines as structured JSON entries.
 */

export interface LogEntry {
  timestamp: string;
  level?: string;
  message?: string;
  [key: string]: unknown;
}

export interface ParseResult {
  entry: LogEntry | null;
  error: string | null;
  raw: string;
}

/**
 * Attempts to parse a single log line as a JSON object with a timestamp field.
 */
export function parseLogLine(line: string): ParseResult {
  const trimmed = line.trim();
  if (!trimmed) {
    return { entry: null, error: 'empty line', raw: line };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return { entry: null, error: 'invalid JSON', raw: line };
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { entry: null, error: 'not a JSON object', raw: line };
  }

  const obj = parsed as Record<string, unknown>;

  const tsField = obj['timestamp'] ?? obj['time'] ?? obj['ts'] ?? obj['@timestamp'];
  if (!tsField || typeof tsField !== 'string') {
    return { entry: null, error: 'missing or invalid timestamp field', raw: line };
  }

  const entry: LogEntry = { ...obj, timestamp: tsField };
  return { entry, error: null, raw: line };
}

/**
 * Parses multiple log lines and returns only successfully parsed entries.
 */
export function parseLogLines(lines: string[]): LogEntry[] {
  return lines
    .map(parseLogLine)
    .filter((r): r is ParseResult & { entry: LogEntry } => r.entry !== null)
    .map((r) => r.entry);
}
