#!/usr/bin/env node
/**
 * cli-mask.ts — CLI for masking sensitive fields in JSON log entries
 */

import * as fs from 'fs';
import * as readline from 'readline';
import { parseLogLine } from './parser';
import { maskEntry, parseMaskFields, MaskOptions } from './mask';

export function printUsage(): void {
  console.error(`Usage: logslice-mask --fields <f1,f2,...> [options] [file]

Options:
  --fields <fields>     Comma-separated list of fields to mask (required)
  --mask-char <char>    Character to use for masking (default: *)
  --mask-length <n>     Fixed length for masked value
  --show-last <n>       Number of trailing characters to reveal
  --help                Show this help message
`);
}

export function parseMaskArgs(argv: string[]): { options: MaskOptions; file?: string } {
  const args = argv.slice(2);
  let fields: string[] = [];
  let maskChar = '*';
  let maskLength: number | undefined;
  let showLast = 0;
  let file: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help') {
      printUsage();
      process.exit(0);
    } else if (arg === '--fields') {
      fields = parseMaskFields(args[++i] ?? '');
    } else if (arg === '--mask-char') {
      maskChar = args[++i] ?? '*';
    } else if (arg === '--mask-length') {
      maskLength = parseInt(args[++i] ?? '0', 10);
    } else if (arg === '--show-last') {
      showLast = parseInt(args[++i] ?? '0', 10);
    } else if (!arg.startsWith('--')) {
      file = arg;
    }
  }

  if (fields.length === 0) {
    console.error('Error: --fields is required');
    printUsage();
    process.exit(1);
  }

  return { options: { fields, maskChar, maskLength, showLast }, file };
}

if (require.main === module) {
  const { options, file } = parseMaskArgs(process.argv);
  const stream = file ? fs.createReadStream(file) : process.stdin;
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  rl.on('line', (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const entry = parseLogLine(trimmed);
    if (entry) {
      console.log(JSON.stringify(maskEntry(entry, options)));
    } else {
      console.log(line);
    }
  });

  rl.on('error', (err) => {
    console.error('Error reading input:', err.message);
    process.exit(1);
  });
}
