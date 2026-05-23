import { evaluateRule, scoreEntry, scoreEntries, formatScoredEntry, ScoreRule } from './score';
import { LogEntry } from './parser';

const makeEntry = (fields: Record<string, unknown>): LogEntry =>
  ({ timestamp: '2024-01-01T00:00:00Z', ...fields } as LogEntry);

describe('evaluateRule', () => {
  it('matches exact value', () => {
    const entry = makeEntry({ level: 'error' });
    expect(evaluateRule(entry, { field: 'level', value: 'error', weight: 1 })).toBe(true);
  });

  it('does not match wrong value', () => {
    const entry = makeEntry({ level: 'info' });
    expect(evaluateRule(entry, { field: 'level', value: 'error', weight: 1 })).toBe(false);
  });

  it('matches regex pattern', () => {
    const entry = makeEntry({ message: 'connection timeout' });
    expect(evaluateRule(entry, { field: 'message', pattern: 'timeout', weight: 2 })).toBe(true);
  });

  it('returns false for missing field', () => {
    const entry = makeEntry({});
    expect(evaluateRule(entry, { field: 'missing', weight: 1 })).toBe(false);
  });

  it('matches field existence when no value or pattern', () => {
    const entry = makeEntry({ error: 'oops' });
    expect(evaluateRule(entry, { field: 'error', weight: 1 })).toBe(true);
  });

  it('handles invalid regex gracefully', () => {
    const entry = makeEntry({ msg: 'hello' });
    expect(evaluateRule(entry, { field: 'msg', pattern: '[invalid', weight: 1 })).toBe(false);
  });
});

describe('scoreEntry', () => {
  const rules: ScoreRule[] = [
    { field: 'level', value: 'error', weight: 10 },
    { field: 'message', pattern: 'timeout', weight: 5 },
    { field: 'service', value: 'api', weight: 2 },
  ];

  it('sums weights for matched rules', () => {
    const entry = makeEntry({ level: 'error', message: 'connection timeout', service: 'api' });
    const result = scoreEntry(entry, rules);
    expect(result.score).toBe(17);
    expect(result.matched).toEqual(['level', 'message', 'service']);
  });

  it('returns score 0 for no matches', () => {
    const entry = makeEntry({ level: 'info', message: 'ok' });
    const result = scoreEntry(entry, rules);
    expect(result.score).toBe(0);
    expect(result.matched).toHaveLength(0);
  });
});

describe('scoreEntries', () => {
  const rules: ScoreRule[] = [
    { field: 'level', value: 'error', weight: 10 },
    { field: 'message', pattern: 'slow', weight: 3 },
  ];

  const entries = [
    makeEntry({ level: 'info', message: 'all good' }),
    makeEntry({ level: 'error', message: 'slow query' }),
    makeEntry({ level: 'warn', message: 'slow response' }),
  ];

  it('sorts by score descending', () => {
    const results = scoreEntries(entries, rules);
    expect(results[0].score).toBe(13);
    expect(results[1].score).toBe(3);
  });

  it('filters by minScore', () => {
    const results = scoreEntries(entries, rules, 5);
    expect(results).toHaveLength(1);
    expect(results[0].score).toBe(13);
  });
});

describe('formatScoredEntry', () => {
  it('includes score and matched fields', () => {
    const entry = makeEntry({ level: 'error' });
    const scored = { entry, score: 10, matched: ['level'] };
    const out = formatScoredEntry(scored);
    expect(out).toContain('score=10');
    expect(out).toContain('matched=level');
  });
});
