#!/usr/bin/env node
/**
 * CLI entry point for the truncate subcommand.
 * Usage: logslice truncate --fields msg,stack --max-length 120 --max-array 10 [file]
 */

import * as fs from 'fs';
import * as readline from 'readline';
import { parseValidEntries } from './parser';
import { truncateEntries, TruncateOptions } from './truncate';

export interface TruncateCliOptions {
  fields: string[];
  maxLength?: number;
  maxArrayItems?: number;
  ellipsis?: string;
  inputFile?: string;
}

export function printUsage(): void {
  console.error(
    'Usage: logslice truncate --fields <f1,f2,...> [--max-length N] [--max-array N] [--ellipsis STR] [file]'
  );
}

export function parseTruncateArgs(argv: string[]): TruncateCliOptions {
  const opts: TruncateCliOptions = { fields: [] };
  const args = argv.slice();

  while (args.length > 0) {
    const arg = args.shift()!;
    if (arg === '--fields') {
      const val = args.shift() ?? '';
      opts.fields = val.split(',').map((f) => f.trim()).filter(Boolean);
    } else if (arg === '--max-length') {
      const n = parseInt(args.shift() ?? '', 10);
      if (!isNaN(n)) opts.maxLength = n;
    } else if (arg === '--max-array') {
      const n = parseInt(args.shift() ?? '', 10);
      if (!isNaN(n)) opts.maxArrayItems = n;
    } else if (arg === '--ellipsis') {
      opts.ellipsis = args.shift() ?? '...';
    } else if (!arg.startsWith('-')) {
      opts.inputFile = arg;
    }
  }

  return opts;
}

async function readLines(filePath?: string): Promise<string[]> {
  const stream = filePath
    ? fs.createReadStream(filePath, { encoding: 'utf8' })
    : process.stdin;
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
  const lines: string[] = [];
  for await (const line of rl) lines.push(line);
  return lines;
}

export async function runTruncateCli(argv: string[]): Promise<void> {
  const opts = parseTruncateArgs(argv);

  if (opts.fields.length === 0 && opts.maxLength === undefined && opts.maxArrayItems === undefined) {
    printUsage();
    process.exit(1);
  }

  const lines = await readLines(opts.inputFile);
  const entries = parseValidEntries(lines);

  const truncateOptions: TruncateOptions = {
    maxLength: opts.maxLength,
    maxArrayItems: opts.maxArrayItems,
    ellipsis: opts.ellipsis,
  };

  const result = truncateEntries(entries, opts.fields, truncateOptions);
  for (const entry of result) {
    process.stdout.write(JSON.stringify(entry) + '\n');
  }
}

if (require.main === module) {
  runTruncateCli(process.argv.slice(2)).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
