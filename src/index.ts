#!/usr/bin/env node
import * as fs from 'fs';
import * as readline from 'readline';
import { parseLogLines } from './parser';
import { applyFilters } from './filter';
import { outputEntries } from './output';
import { parseCliArgs, buildFilterOptions } from './cli-args';

async function readLines(filePath: string): Promise<string[]> {
  const lines: string[] = [];
  const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
  for await (const line of rl) {
    lines.push(line);
  }
  return lines;
}

async function readStdin(): Promise<string[]> {
  const lines: string[] = [];
  const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
  for await (const line of rl) {
    lines.push(line);
  }
  return lines;
}

async function main(): Promise<void> {
  const args = parseCliArgs(process.argv.slice(2));
  const filterOptions = buildFilterOptions(args);

  let rawLines: string[];

  if (args.file) {
    if (!fs.existsSync(args.file)) {
      console.error(`Error: File not found: ${args.file}`);
      process.exit(1);
    }
    rawLines = await readLines(args.file);
  } else if (!process.stdin.isTTY) {
    rawLines = await readStdin();
  } else {
    console.error('Error: No input file specified and no data piped to stdin.');
    console.error('Usage: logslice [options] [file]');
    process.exit(1);
  }

  const entries = parseLogLines(rawLines);
  const filtered = applyFilters(entries, filterOptions);

  if (filtered.length === 0) {
    process.stderr.write('No log entries matched the given filters.\n');
    process.exit(0);
  }

  await outputEntries(filtered, {
    format: args.format ?? 'pretty',
    outputFile: args.output,
    fields: args.fields,
    color: args.color ?? true,
  });
}

main().catch((err) => {
  console.error('Unexpected error:', err instanceof Error ? err.message : err);
  process.exit(1);
});
