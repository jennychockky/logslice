/**
 * sample.ts — Randomly sample log entries by rate or count
 */

export interface SampleOptions {
  rate?: number;   // 0.0 - 1.0, e.g. 0.1 = 10%
  count?: number;  // exact number of entries to return
  seed?: number;   // optional seed for deterministic sampling
}

export type LogEntry = Record<string, unknown>;

/**
 * Simple seeded pseudo-random number generator (LCG).
 */
export function createRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

/**
 * Sample entries by a probability rate (0.0–1.0).
 */
export function sampleByRate(
  entries: LogEntry[],
  rate: number,
  rng: () => number = Math.random
): LogEntry[] {
  if (rate <= 0) return [];
  if (rate >= 1) return entries;
  return entries.filter(() => rng() < rate);
}

/**
 * Sample exactly `count` entries (reservoir sampling).
 */
export function sampleByCount(
  entries: LogEntry[],
  count: number,
  rng: () => number = Math.random
): LogEntry[] {
  if (count <= 0) return [];
  if (count >= entries.length) return [...entries];

  const reservoir = entries.slice(0, count);
  for (let i = count; i < entries.length; i++) {
    const j = Math.floor(rng() * (i + 1));
    if (j < count) {
      reservoir[j] = entries[i];
    }
  }
  return reservoir;
}

/**
 * Apply sampling options to a list of log entries.
 */
export function sampleEntries(
  entries: LogEntry[],
  options: SampleOptions
): LogEntry[] {
  const rng = options.seed !== undefined ? createRng(options.seed) : Math.random;

  if (options.count !== undefined) {
    return sampleByCount(entries, options.count, rng);
  }
  if (options.rate !== undefined) {
    return sampleByRate(entries, options.rate, rng);
  }
  return entries;
}
