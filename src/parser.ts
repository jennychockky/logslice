export type LogEntry = Record<string, unknown>;

export interface ParseResult {
  entry: LogEntry | null;
  raw: string;
  error?: string;
}

export function parseLogLine(line: string): ParseResult {
  const trimmed = line.trim();
  if (!trimmed) {
    return { entry: null, raw: line, error: 'empty line' };
  }
  try {
    const entry = JSON.parse(trimmed) as LogEntry;
    if (typeof entry !== 'object' || Array.isArray(entry) || entry === null) {
      return { entry: null, raw: line, error: 'not a JSON object' };
    }
    return { entry, raw: line };
  } catch (err) {
    return {
      entry: null,
      raw: line,
      error: `JSON parse error: ${(err as Error).message}`,
    };
  }
}

export function parseLogLines(input: string): ParseResult[] {
  const lines = input.split('\n');
  return lines.map(parseLogLine);
}

export function parseValidEntries(input: string): LogEntry[] {
  return parseLogLines(input)
    .filter((r) => r.entry !== null)
    .map((r) => r.entry as LogEntry);
}
