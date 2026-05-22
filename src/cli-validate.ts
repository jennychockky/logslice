#!/usr/bin/env node
/**
 * CLI entry point for validating log entries against a schema.
 * Usage: logslice-validate --schema "level:!string,ts:!string" [file]
 */

import * as fs from "fs";
import * as readline from "readline";
import { parseSchema, validateEntry } from "./validate";
import { parseLogLine } from "./parser";

function printUsage(): void {
  console.error(
    "Usage: logslice-validate --schema <schema> [file]\n" +
      "  --schema   Comma-separated field:type pairs. Prefix type with ! for required.\n" +
      "  --strict   Exit with non-zero code if any entry is invalid.\n" +
      "  --quiet    Suppress per-entry error output.\n" +
      "Example: logslice-validate --schema \"level:!string,ts:!string\" app.log"
  );
}

export function parseValidateArgs(argv: string[]): {
  schemaStr: string;
  file?: string;
  strict: boolean;
  quiet: boolean;
} {
  const args = argv.slice(2);
  let schemaStr = "";
  let file: string | undefined;
  let strict = false;
  let quiet = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--schema" && args[i + 1]) {
      schemaStr = args[++i];
    } else if (args[i] === "--strict") {
      strict = true;
    } else if (args[i] === "--quiet") {
      quiet = true;
    } else if (!args[i].startsWith("--")) {
      file = args[i];
    }
  }

  return { schemaStr, file, strict, quiet };
}

async function main(): Promise<void> {
  const { schemaStr, file, strict, quiet } = parseValidateArgs(process.argv);

  if (!schemaStr) {
    printUsage();
    process.exit(1);
  }

  const schema = parseSchema(schemaStr);
  const stream = file ? fs.createReadStream(file) : process.stdin;
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  let total = 0;
  let invalid = 0;

  for await (const line of rl) {
    if (!line.trim()) continue;
    const entry = parseLogLine(line);
    if (!entry) continue;
    total++;
    const result = validateEntry(entry, schema);
    if (!result.valid) {
      invalid++;
      if (!quiet) {
        console.error(`[INVALID] ${line.trim()}`);
        for (const err of result.errors) console.error(`  - ${err}`);
      }
    } else {
      console.log(line.trim());
    }
  }

  if (!quiet) {
    console.error(`\nValidated ${total} entries: ${invalid} invalid, ${total - invalid} valid.`);
  }

  if (strict && invalid > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
