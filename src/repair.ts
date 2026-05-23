/**
 * repair.ts — Utilities to repair and recover malformed JSON log entries.
 */

export interface RepairResult {
  entry: Record<string, unknown> | null;
  repaired: boolean;
  error?: string;
}

/**
 * Attempt to parse a raw string as JSON, applying light repair heuristics.
 */
export function repairJsonLine(raw: string): RepairResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { entry: null, repaired: false, error: 'empty line' };
  }

  // Try direct parse first
  try {
    const parsed = JSON.parse(trimmed);
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return { entry: parsed as Record<string, unknown>, repaired: false };
    }
    return { entry: null, repaired: false, error: 'not a JSON object' };
  } catch {
    // Fall through to repair attempts
  }

  // Heuristic 1: strip trailing commas before closing braces/brackets
  const noTrailingComma = trimmed.replace(/,\s*([}\]])/g, '$1');
  try {
    const parsed = JSON.parse(noTrailingComma);
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return { entry: parsed as Record<string, unknown>, repaired: true };
    }
  } catch {
    // continue
  }

  // Heuristic 2: wrap bare key=value lines into a JSON object
  if (!trimmed.startsWith('{')) {
    const kvPairs = trimmed.split(/\s+/);
    const obj: Record<string, unknown> = {};
    let matched = 0;
    for (const pair of kvPairs) {
      const eq = pair.indexOf('=');
      if (eq > 0) {
        const key = pair.slice(0, eq);
        const val = pair.slice(eq + 1);
        obj[key] = isNaN(Number(val)) ? val : Number(val);
        matched++;
      }
    }
    if (matched > 0) {
      return { entry: obj, repaired: true };
    }
  }

  return { entry: null, repaired: false, error: 'unable to repair' };
}

/**
 * Repair multiple raw lines, returning all successfully parsed entries.
 */
export function repairLines(
  lines: string[]
): { entries: Record<string, unknown>[]; repairedCount: number; failedCount: number } {
  let repairedCount = 0;
  let failedCount = 0;
  const entries: Record<string, unknown>[] = [];

  for (const line of lines) {
    const result = repairJsonLine(line);
    if (result.entry) {
      entries.push(result.entry);
      if (result.repaired) repairedCount++;
    } else {
      failedCount++;
    }
  }

  return { entries, repairedCount, failedCount };
}
