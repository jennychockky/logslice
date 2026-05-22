#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { parseValidEntries } from './parser';
import { mergeEntries, MergeOptions } from './merge';
import { formatEntries } from './formatter';

function printUsage(): void {
  console.error(
    'Usage: logslice-merge [options] <file1> <file2> [file3...]\n' +
    'Options:\n' +
    '  --sort <field>       Sort merged output by field (e.g. timestamp)\n' +
    '  --dedup              Remove duplicate entries\n' +
    '  --dedup-fields <f>   Comma-separated fields to use for dedup key\n' +
    '  --pretty             Pretty-print output\n' +
    '  --help               Show this help'
  );
}

function parseArgs(argv: string[]): {
  files: string[];
  options: MergeOptions;
  pretty: boolean;
} {
  const files: string[] = [];
  const options: MergeOptions = {};
  let pretty = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help') {
      printUsage();
      process.exit(0);
    } else if (arg === '--sort') {
      options.sortField = argv[++i];
    } else if (arg === '--dedup') {
      options.dedup = true;
    } else if (arg === '--dedup-fields') {
      options.dedupFields = argv[++i].split(',').map((f) => f.trim());
    } else if (arg === '--pretty') {
      pretty = true;
    } else if (!arg.startsWith('--')) {
      files.push(arg);
    }
  }

  return { files, options, pretty };
}

if (require.main === module) {
  const { files, options, pretty } = parseArgs(process.argv.slice(2));

  if (files.length < 2) {
    console.error('Error: at least two input files are required.');
    printUsage();
    process.exit(1);
  }

  const sources = files.map((f) => {
    const raw = fs.readFileSync(path.resolve(f), 'utf8');
    return parseValidEntries(raw.split('\n'));
  });

  const merged = mergeEntries(sources, options);
  const output = formatEntries(merged, { pretty });
  process.stdout.write(output + '\n');
}

export { parseArgs };
