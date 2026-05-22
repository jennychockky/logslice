#!/usr/bin/env node
/**
 * cli-highlight.ts — CLI wrapper that reads NDJSON from stdin/file and
 * pretty-prints each entry with syntax highlighting.
 */

import * as fs from "fs";
import * as readline from "readline";
import { highlightJson, defaultHighlightOptions, HighlightOptions } from "./highlight";

export interface HighlightCliOptions {
  noColor: boolean;
  inputFile?: string;
}

export function parseHighlightArgs(argv: string[]): HighlightCliOptions {
  const opts: HighlightCliOptions = { noColor: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--no-color") {
      opts.noColor = true;
    } else if (arg === "--file" || arg === "-f") {
      opts.inputFile = argv[++i];
    } else if (!arg.startsWith("-")) {
      opts.inputFile = arg;
    }
  }
  return opts;
}

export function printUsage(): void {
  console.log("Usage: logslice-highlight [--no-color] [--file <path>] [<file>]");
}

export async function runHighlightCli(
  argv: string[],
  writeLine: (s: string) => void = console.log
): Promise<void> {
  if (argv.includes("--help") || argv.includes("-h")) {
    printUsage();
    return;
  }

  const cliOpts = parseHighlightArgs(argv);
  const hlOpts: HighlightOptions = defaultHighlightOptions(!cliOpts.noColor);

  const input: NodeJS.ReadableStream = cliOpts.inputFile
    ? fs.createReadStream(cliOpts.inputFile, { encoding: "utf8" })
    : process.stdin;

  const rl = readline.createInterface({ input, crlfDelay: Infinity });

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const obj = JSON.parse(trimmed) as Record<string, unknown>;
      writeLine(highlightJson(obj, hlOpts));
    } catch {
      writeLine(trimmed);
    }
  }
}

if (require.main === module) {
  runHighlightCli(process.argv.slice(2)).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
