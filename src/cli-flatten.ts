#!/usr/bin/env node
/**
 * CLI entry point for flattening nested JSON log entries.
 * Usage: logslice-flatten [--separator=.] [--unflatten] [file]
 */

import * as fs from "fs";
import * as readline from "readline";
import { flattenEntry, unflattenObject, LogEntry } from "./flatten";
import { parseLogLine } from "./parser";

export function printUsage(): void {
  console.error("Usage: logslice-flatten [options] [file]");
  console.error("");
  console.error("Options:");
  console.error("  --separator=CHAR   Field separator (default: '.')");
  console.error("  --unflatten        Reverse: expand dot-keys into nested objects");
  console.error("  --help             Show this help message");
}

export interface FlattenCliOptions {
  separator: string;
  unflatten: boolean;
  file: string | null;
}

export function parseFlattenArgs(argv: string[]): FlattenCliOptions {
  const opts: FlattenCliOptions = { separator: ".", unflatten: false, file: null };

  for (const arg of argv) {
    if (arg === "--help") {
      printUsage();
      process.exit(0);
    } else if (arg.startsWith("--separator=")) {
      opts.separator = arg.slice("--separator=".length) || ".";
    } else if (arg === "--unflatten") {
      opts.unflatten = true;
    } else if (!arg.startsWith("--")) {
      opts.file = arg;
    }
  }

  return opts;
}

async function run(argv: string[]): Promise<void> {
  const opts = parseFlattenArgs(argv);

  const input: NodeJS.ReadableStream = opts.file
    ? fs.createReadStream(opts.file, { encoding: "utf8" })
    : process.stdin;

  const rl = readline.createInterface({ input, crlfDelay: Infinity });

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const entry = parseLogLine(trimmed);
    if (!entry) {
      process.stderr.write(`Skipping invalid line: ${trimmed}\n`);
      continue;
    }

    const transformed: LogEntry = opts.unflatten
      ? unflattenObject(entry as Record<string, unknown>, opts.separator)
      : flattenEntry(entry as Record<string, unknown>, opts.separator);

    process.stdout.write(JSON.stringify(transformed) + "\n");
  }
}

if (require.main === module) {
  run(process.argv.slice(2)).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
