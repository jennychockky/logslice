#!/usr/bin/env node
import * as fs from 'fs';
import * as readline from 'readline';
import { parseLogLine } from './parser';
import { ScoreRule, scoreEntries, formatScoredEntry } from './score';

function printUsage(): void {
  console.error('Usage: cli-score [--rule field:value:weight] [--pattern field:regex:weight]');
  console.error('                 [--min-score N] [--top N] [--format text|json] [file]');
  console.error('Reads NDJSON, scores entries by rules, outputs ranked results.');
}

export function parseScoreArgs(argv: string[]): {
  rules: ScoreRule[];
  minScore: number;
  top: number | null;
  format: 'text' | 'json';
  file: string | null;
} {
  const rules: ScoreRule[] = [];
  let minScore = 0;
  let top: number | null = null;
  let format: 'text' | 'json' = 'text';
  let file: string | null = null;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--rule') {
      const parts = argv[++i].split(':');
      if (parts.length < 3) throw new Error(`Invalid rule: ${argv[i]}`);
      const [field, value, w] = parts;
      rules.push({ field, value, weight: Number(w) });
    } else if (arg === '--pattern') {
      const parts = argv[++i].split(':');
      if (parts.length < 3) throw new Error(`Invalid pattern: ${argv[i]}`);
      const [field, pattern, w] = parts;
      rules.push({ field, pattern, weight: Number(w) });
    } else if (arg === '--min-score') {
      minScore = Number(argv[++i]);
    } else if (arg === '--top') {
      top = Number(argv[++i]);
    } else if (arg === '--format') {
      format = argv[++i] as 'text' | 'json';
    } else if (!arg.startsWith('--')) {
      file = arg;
    }
  }

  return { rules, minScore, top, format, file };
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  const { rules, minScore, top, format, file } = parseScoreArgs(args);

  if (rules.length === 0) {
    console.error('Error: at least one --rule or --pattern is required');
    printUsage();
    process.exit(1);
  }

  const stream = file ? fs.createReadStream(file) : process.stdin;
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
  const entries = [];
  for await (const line of rl) {
    const entry = parseLogLine(line);
    if (entry) entries.push(entry);
  }

  let results = scoreEntries(entries, rules, minScore);
  if (top !== null) results = results.slice(0, top);

  if (format === 'json') {
    console.log(JSON.stringify(results.map((r) => ({ ...r.entry, _score: r.score, _matched: r.matched })), null, 2));
  } else {
    for (const r of results) console.log(formatScoredEntry(r));
  }
}

main().catch((e) => { console.error(e.message); process.exit(1); });
