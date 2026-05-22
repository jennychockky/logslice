#!/usr/bin/env node
import * as fs from "fs";
import * as readline from "readline";
import { parseLogLine } from "./parser";
import { aggregateEntries, formatAggregateResults } from "./aggregate";

function printUsage(): void {
  console.error("Usage: logslice-aggregate --group <field> [--sum <field>] [file]");
  console.error("  Reads NDJSON log entries and aggregates by a field.");
  console.error("  If no file is given, reads from stdin.");
}

function parseArgs(argv: string[]): { groupBy: string; sumField?: string; file?: string } | null {
  const args = argv.slice(2);
  let groupBy: string | undefined;
  let sumField: string | undefined;
  let file: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--group" && args[i + 1]) {
      groupBy = args[++i];
    } else if (args[i] === "--sum" && args[i + 1]) {
      sumField = args[++i];
    } else if (!args[i].startsWith("-")) {
      file = args[i];
    }
  }

  if (!groupBy) return null;
  return { groupBy, sumField, file };
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv);
  if (!opts) {
    printUsage();
    process.exit(1);
  }

  const stream = opts.file
    ? fs.createReadStream(opts.file, { encoding: "utf8" })
    : process.stdin;

  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
  const entries = [];

  for await (const line of rl) {
    const entry = parseLogLine(line);
    if (entry) entries.push(entry);
  }

  const results = aggregateEntries(entries, { groupBy: opts.groupBy, sumField: opts.sumField });
  console.log(formatAggregateResults(results, opts.sumField));
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
