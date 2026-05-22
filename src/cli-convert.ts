#!/usr/bin/env node
import * as fs from 'fs';
import * as readline from 'readline';
import { parseLogLines } from './parser';
import { convertEntries, ConvertFormat } from './convert';

function printUsage(): void {
  console.error(`Usage: logslice-convert [options] [file]

Options:
  --format <csv|tsv|jsonarray>  Output format (default: csv)
  --fields <f1,f2,...>          Fields to include (default: all)
  --no-header                   Omit header row (CSV/TSV only)
  --out <file>                  Write output to file instead of stdout
  --help                        Show this help
`);
}

export function parseConvertArgs(argv: string[]): {
  format: ConvertFormat;
  fields?: string[];
  includeHeader: boolean;
  inputFile?: string;
  outputFile?: string;
} {
  const args = argv.slice(2);
  let format: ConvertFormat = 'csv';
  let fields: string[] | undefined;
  let includeHeader = true;
  let inputFile: string | undefined;
  let outputFile: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help') { printUsage(); process.exit(0); }
    else if (arg === '--format') { format = args[++i] as ConvertFormat; }
    else if (arg === '--fields') { fields = args[++i].split(','); }
    else if (arg === '--no-header') { includeHeader = false; }
    else if (arg === '--out') { outputFile = args[++i]; }
    else if (!arg.startsWith('-')) { inputFile = arg; }
  }
  return { format, fields, includeHeader, inputFile, outputFile };
}

async function readLines(filePath?: string): Promise<string[]> {
  const stream = filePath ? fs.createReadStream(filePath) : process.stdin;
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
  const lines: string[] = [];
  for await (const line of rl) lines.push(line);
  return lines;
}

async function main(): Promise<void> {
  const opts = parseConvertArgs(process.argv);
  const lines = await readLines(opts.inputFile);
  const entries = parseLogLines(lines).filter(e => e !== null) as any[];
  const result = convertEntries(entries, {
    format: opts.format,
    fields: opts.fields,
    includeHeader: opts.includeHeader,
  });
  if (opts.outputFile) {
    fs.writeFileSync(opts.outputFile, result + '\n', 'utf8');
  } else {
    process.stdout.write(result + '\n');
  }
}

main().catch(err => { console.error(err.message); process.exit(1); });
