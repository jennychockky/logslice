import * as fs from 'fs';
import * as readline from 'readline';
import { parseLogLine } from './parser';
import { computeStats, formatStats } from './stats';

export interface StatsOptions {
  input: string | null; // file path or null for stdin
  json: boolean;
}

export async function runStats(options: StatsOptions): Promise<void> {
  const lines = await readLines(options.input);
  const entries = lines
    .map(parseLogLine)
    .filter((e): e is NonNullable<typeof e> => e !== null);

  const stats = computeStats(entries);

  if (options.json) {
    const jsonStats = {
      total: stats.total,
      byLevel: stats.byLevel,
      earliest: stats.earliest,
      latest: stats.latest,
      fields: [...stats.fields].sort(),
    };
    process.stdout.write(JSON.stringify(jsonStats, null, 2) + '\n');
  } else {
    process.stdout.write(formatStats(stats) + '\n');
  }
}

async function readLines(filePath: string | null): Promise<string[]> {
  const stream = filePath
    ? fs.createReadStream(filePath, { encoding: 'utf8' })
    : process.stdin;

  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
  const lines: string[] = [];

  for await (const line of rl) {
    const trimmed = line.trim();
    if (trimmed) lines.push(trimmed);
  }

  return lines;
}
