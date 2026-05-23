import * as fs from 'fs';
import * as readline from 'readline';
import { parseLogLine } from './parser';
import { pivotEntries, formatPivotTable } from './pivot';
import { validatePivotOptions, describePivotOptions, PivotCliOptions } from './pivot-options';

export function printUsage(): void {
  console.log(`
Usage: logslice-pivot [options] [file]

Options:
  --row <field>       Row grouping field (required)
  --col <field>       Column grouping field (required)
  --value <field>     Numeric field to aggregate
  --agg <fn>          Aggregation: count | sum | avg (default: count)
  --output <file>     Output file (default: stdout)
  -h, --help          Show help
`.trim());
}

export function parsePivotArgs(argv: string[]): PivotCliOptions {
  const opts: Partial<PivotCliOptions> = { aggFn: 'count' };
  const args = argv.slice(2);
  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    if (arg === '-h' || arg === '--help') { printUsage(); process.exit(0); }
    else if (arg === '--row') { opts.rowField = args[++i]; }
    else if (arg === '--col') { opts.colField = args[++i]; }
    else if (arg === '--value') { opts.valueField = args[++i]; }
    else if (arg === '--agg') { opts.aggFn = args[++i] as PivotCliOptions['aggFn']; }
    else if (arg === '--output') { opts.outputFile = args[++i]; }
    else if (!arg.startsWith('-')) { opts.inputFile = arg; }
    i++;
  }
  const errors = validatePivotOptions(opts);
  if (errors.length) {
    errors.forEach(e => console.error(`Error: ${e}`));
    process.exit(1);
  }
  return opts as PivotCliOptions;
}

export async function runPivot(argv: string[]): Promise<void> {
  const opts = parsePivotArgs(argv);
  const stream = opts.inputFile
    ? fs.createReadStream(opts.inputFile)
    : process.stdin;
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
  const entries: ReturnType<typeof parseLogLine>[] = [];
  for await (const line of rl) {
    const entry = parseLogLine(line);
    if (entry) entries.push(entry);
  }
  const result = pivotEntries(entries, opts);
  const output = formatPivotTable(result) + '\n';
  if (opts.outputFile) {
    fs.writeFileSync(opts.outputFile, output, 'utf8');
    console.error(`[pivot] ${describePivotOptions(opts)} → ${opts.outputFile}`);
  } else {
    process.stdout.write(output);
  }
}
