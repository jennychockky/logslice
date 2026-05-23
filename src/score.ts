import { LogEntry } from './parser';

export interface ScoreRule {
  field: string;
  value?: string | number | boolean;
  pattern?: string;
  weight: number;
}

export interface ScoredEntry {
  entry: LogEntry;
  score: number;
  matched: string[];
}

export function evaluateRule(entry: LogEntry, rule: ScoreRule): boolean {
  const val = entry[rule.field];
  if (val === undefined || val === null) return false;

  if (rule.pattern !== undefined) {
    try {
      const re = new RegExp(rule.pattern);
      return re.test(String(val));
    } catch {
      return false;
    }
  }

  if (rule.value !== undefined) {
    return val === rule.value || String(val) === String(rule.value);
  }

  // field exists and is truthy
  return Boolean(val);
}

export function scoreEntry(entry: LogEntry, rules: ScoreRule[]): ScoredEntry {
  let score = 0;
  const matched: string[] = [];

  for (const rule of rules) {
    if (evaluateRule(entry, rule)) {
      score += rule.weight;
      matched.push(rule.field);
    }
  }

  return { entry, score, matched };
}

export function scoreEntries(
  entries: LogEntry[],
  rules: ScoreRule[],
  minScore = 0
): ScoredEntry[] {
  return entries
    .map((e) => scoreEntry(e, rules))
    .filter((s) => s.score >= minScore)
    .sort((a, b) => b.score - a.score);
}

export function formatScoredEntry(scored: ScoredEntry): string {
  const base = JSON.stringify(scored.entry);
  return `[score=${scored.score} matched=${scored.matched.join(',')}] ${base}`;
}
