#!/usr/bin/env node
/**
 * cli-sample.ts — CLI entry point for log sampling
 * Usage: logslice-sample [--rate <0-1>] [--count <n>] [--seed <n>] [file]
 */

import * as fs from "fs";
import * as readline from "readline";
import { parseLogLine } from "./parser";
import { sampleEntries, SampleOptions } from "./sample";

function printUsage(): void {
  console.error(
    "Usage: logslice-sample [--rate <0.0-1.0>] [--count <n>] [--seed <n>] [file]"
  );
}

export function parseSampleArgs(argv: string[]): {
  options: SampleOptions;
  file?: string;
} {
  const options: SampleOptions = {};
  let file: string | undefined;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--rate") {
      options.rate = parseFloat(argv[++i]);
    } else if (arg === "--count") {
      options.count = parseInt(argv[++i], 10);
    } else if (arg === "--seed") {
      options.seed = parseInt(argv[++i], 10);
    } else if (!arg.startsWith("--")) {
      file = arg;
    }
  }

  return { options, file };
}

export async function runSample(argv: string[]): Promise<void> {
  if (argv.includes("--help") || argv.includes("-h")) {
    printUsage();
    return;
  }

  const { options, file } = parseSampleArgs(argv);

  if (options.rate !== undefined && (options.rate < 0 || options.rate > 1)) {
    console.error("Error: --rate must be between 0.0 and 1.0");
    process.exit(1);
  }

  const stream = file ? fs.createReadStream(file) : process.stdin;
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  const entries: Record<string, unknown>[] = [];
  for await (const line of rl) {
    const entry = parseLogLine(line);
    if (entry) entries.push(entry);
  }

  const sampled = sampleEntries(entries, options);
  for (const entry of sampled) {
    process.stdout.write(JSON.stringify(entry) + "\n");
  }
}

if (require.main === module) {
  runSample(process.argv.slice(2)).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
