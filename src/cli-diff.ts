#!/usr/bin/env node
import * as fs from 'fs';
import { parseValidEntries } from './parser';
import { diffEntries, formatDiffSummary, DiffOptions } from './diff';

function printUsage(): void {
  console.error(`
Usage: logslice-diff [options] <base-file> <compare-file>

Options:
  --key <fields>     Comma-separated fields to use as identity key
  --ignore <fields>  Comma-separated fields to ignore in comparison
  --added            Show only added entries
  --removed          Show only removed entries
  --summary          Print only the summary
  --help             Show this help
`.trim());
}

export interface DiffCliOptions {
  baseFile: string;
  compareFile: string;
  diffOptions: DiffOptions;
  showAdded: boolean;
  showRemoved: boolean;
  summaryOnly: boolean;
}

export function parseDiffArgs(argv: string[]): DiffCliOptions | null {
  const args = argv.slice(2);
  if (args.includes('--help') || args.length < 2) {
    printUsage();
    return null;
  }

  const opts: DiffCliOptions = {
    baseFile: '',
    compareFile: '',
    diffOptions: {},
    showAdded: false,
    showRemoved: false,
    summaryOnly: false,
  };

  const positional: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--key') {
      opts.diffOptions.keyFields = (args[++i] ?? '').split(',').filter(Boolean);
    } else if (arg === '--ignore') {
      opts.diffOptions.ignoreFields = (args[++i] ?? '').split(',').filter(Boolean);
    } else if (arg === '--added') {
      opts.showAdded = true;
    } else if (arg === '--removed') {
      opts.showRemoved = true;
    } else if (arg === '--summary') {
      opts.summaryOnly = true;
    } else if (!arg.startsWith('--')) {
      positional.push(arg);
    }
  }

  if (positional.length < 2) {
    printUsage();
    return null;
  }

  opts.baseFile = positional[0];
  opts.compareFile = positional[1];
  return opts;
}

if (require.main === module) {
  const opts = parseDiffArgs(process.argv);
  if (!opts) process.exit(1);

  const baseLines = fs.readFileSync(opts.baseFile, 'utf8').split('\n');
  const compareLines = fs.readFileSync(opts.compareFile, 'utf8').split('\n');

  const base = parseValidEntries(baseLines);
  const compare = parseValidEntries(compareLines);

  const result = diffEntries(base, compare, opts.diffOptions);

  if (!opts.summaryOnly) {
    if (!opts.showRemoved) {
      result.added.forEach((e) => console.log(JSON.stringify(e)));
    }
    if (!opts.showAdded) {
      result.removed.forEach((e) => console.log(JSON.stringify(e)));
    }
  }

  console.error(formatDiffSummary(result));
}
