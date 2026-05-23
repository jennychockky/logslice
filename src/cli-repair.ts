#!/usr/bin/env node
import * as fs from "fs";
import * as readline from "readline";
import { repairLines } from "./repair";
import { parseLogLines } from "./parser";

function printUsage(): void {
  console.error(`
Usage: logslice-repair [options] [file...]

Attempt to repair malformed JSON log lines.

Options:
  --output, -o <file>   Write repaired output to file (default: stdout)
  --strict              Only output lines that were successfully repaired
  --summary             Print repair summary to stderr
  --help, -h            Show this help message

Examples:
  logslice-repair broken.log
  logslice-repair --strict --summary broken.log -o fixed.log
  cat broken.log | logslice-repair
`);
}

export interface RepairArgs {
  files: string[];
  output: string | null;
  strict: boolean;
  summary: boolean;
}

export function parseRepairArgs(argv: string[]): RepairArgs {
  const args: RepairArgs = {
    files: [],
    output: null,
    strict: false,
    summary: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    } else if (arg === "--output" || arg === "-o") {
      args.output = argv[++i];
    } else if (arg === "--strict") {
      args.strict = true;
    } else if (arg === "--summary") {
      args.summary = true;
    } else if (!arg.startsWith("-")) {
      args.files.push(arg);
    }
  }

  return args;
}

async function readAllInput(files: string[]): Promise<string[]> {
  if (files.length > 0) {
    const lines: string[] = [];
    for (const file of files) {
      const content = fs.readFileSync(file, "utf8");
      lines.push(...content.split("\n").filter((l) => l.trim().length > 0));
    }
    return lines;
  }
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin });
    const lines: string[] = [];
    rl.on("line", (line) => { if (line.trim()) lines.push(line); });
    rl.on("close", () => resolve(lines));
  });
}

async function main(): Promise<void> {
  const args = parseRepairArgs(process.argv.slice(2));
  const rawLines = await readAllInput(args.files);
  const { repaired, failed } = repairLines(rawLines);

  const outputLines = args.strict ? repaired : [...repaired, ...failed.map((f) => f.original)];
  const entries = parseLogLines(outputLines);
  const out = entries.map((e) => JSON.stringify(e)).join("\n") + "\n";

  if (args.output) {
    fs.writeFileSync(args.output, out, "utf8");
  } else {
    process.stdout.write(out);
  }

  if (args.summary) {
    console.error(`Repair summary: ${repaired.length} repaired, ${failed.length} failed, ${rawLines.length} total`);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
