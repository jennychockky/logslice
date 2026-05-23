#!/usr/bin/env node

import * as fs from "fs";
import * as readline from "readline";
import { parseLogLine } from "./parser";
import { sliceEntries, SliceOptions } from "./slice";
import { formatEntries } from "./formatter";

function printUsage(): void {
  console.error(`
Usage: logslice-slice [options] [file]

Options:
  --head <n>        Take first N entries
  --tail <n>        Take last N entries
  --from <n>        Start index (0-based, inclusive)
  --to <n>          End index (0-based, exclusive)
  --pretty          Pretty-print output
  --help            Show this help message

Reads from stdin if no file is provided.
`.trim());
}

export interface SliceCliOptions {
  head?: number;
  tail?: number;
  from?: number;
  to?: number;
  pretty: boolean;
  file?: string;
}

export function parseSliceArgs(argv: string[]): SliceCliOptions {
  const opts: SliceCliOptions = { pretty: false };
  const args = argv.slice(2);

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--help") {
      printUsage();
      process.exit(0);
    } else if (arg === "--head") {
      opts.head = parseInt(args[++i], 10);
    } else if (arg === "--tail") {
      opts.tail = parseInt(args[++i], 10);
    } else if (arg === "--from") {
      opts.from = parseInt(args[++i], 10);
    } else if (arg === "--to") {
      opts.to = parseInt(args[++i], 10);
    } else if (arg === "--pretty") {
      opts.pretty = true;
    } else if (!arg.startsWith("--")) {
      opts.file = arg;
    }
  }

  return opts;
}

async function main(): Promise<void> {
  const opts = parseSliceArgs(process.argv);

  const input = opts.file
    ? fs.createReadStream(opts.file, { encoding: "utf8" })
    : process.stdin;

  const rl = readline.createInterface({ input, crlfDelay: Infinity });
  const entries: Record<string, unknown>[] = [];

  for await (const line of rl) {
    const entry = parseLogLine(line);
    if (entry) entries.push(entry);
  }

  const sliceOpts: SliceOptions = {
    head: opts.head,
    tail: opts.tail,
    from: opts.from,
    to: opts.to,
  };

  const sliced = sliceEntries(entries, sliceOpts);
  const output = formatEntries(sliced, { pretty: opts.pretty });
  process.stdout.write(output + "\n");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
