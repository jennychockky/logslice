#!/usr/bin/env node
/**
 * CLI entry point for the enrich command.
 * Usage: logslice-enrich [options] <file>
 */

import * as fs from "fs";
import { parseValidEntries } from "./parser";
import { enrichEntries, EnrichOptions } from "./enrich";

export function printUsage(): void {
  console.error(`Usage: logslice-enrich [options] <file>

Options:
  --set <key=value>      Add a static field (repeatable)
  --add-timestamp        Add _enriched_at timestamp field
  --timestamp-field <f>  Custom name for timestamp field
  --add-index            Add _index field with line number
  --index-field <f>      Custom name for index field
  --help                 Show this help
`);
}

export function parseEnrichArgs(argv: string[]): {
  file: string;
  options: EnrichOptions;
} {
  const args = argv.slice(2);
  const staticFields: Record<string, unknown> = {};
  let addTimestamp = false;
  let timestampField: string | undefined;
  let addIndex = false;
  let indexField: string | undefined;
  let file = "";

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--help") {
      printUsage();
      process.exit(0);
    } else if (arg === "--set" && args[i + 1]) {
      const pair = args[++i];
      const eq = pair.indexOf("=");
      if (eq === -1) throw new Error(`Invalid --set value: ${pair}`);
      const key = pair.slice(0, eq);
      const val = pair.slice(eq + 1);
      staticFields[key] = val;
    } else if (arg === "--add-timestamp") {
      addTimestamp = true;
    } else if (arg === "--timestamp-field" && args[i + 1]) {
      timestampField = args[++i];
    } else if (arg === "--add-index") {
      addIndex = true;
    } else if (arg === "--index-field" && args[i + 1]) {
      indexField = args[++i];
    } else if (!arg.startsWith("--")) {
      file = arg;
    }
  }

  if (!file) throw new Error("No input file specified");

  return {
    file,
    options: { staticFields, addTimestamp, timestampField, addIndex, indexField },
  };
}

if (require.main === module) {
  try {
    const { file, options } = parseEnrichArgs(process.argv);
    const raw = fs.readFileSync(file, "utf-8");
    const entries = parseValidEntries(raw.split("\n"));
    const enriched = enrichEntries(entries, options);
    for (const entry of enriched) {
      process.stdout.write(JSON.stringify(entry) + "\n");
    }
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }
}
