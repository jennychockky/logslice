#!/usr/bin/env node
/**
 * cli-template.ts — CLI for rendering templates against NDJSON log entries
 *
 * Usage:
 *   logslice-template --template "{{level}}: {{message}}" [--field summary] [--missing N/A] [file]
 */

import * as fs from 'fs';
import * as readline from 'readline';
import { parseLogLine } from './parser';
import { renderTemplate, enrichWithTemplate } from './template';

export function printUsage(): void {
  console.error(
    'Usage: logslice-template --template <tmpl> [--field <name>] [--missing <val>] [file]'
  );
}

export interface TemplateCliOptions {
  template: string;
  field?: string;
  missingValue: string;
  inputFile?: string;
}

export function parseTemplateArgs(argv: string[]): TemplateCliOptions {
  const args = argv.slice(2);
  let template = '';
  let field: string | undefined;
  let missingValue = '';
  let inputFile: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--template' && args[i + 1]) {
      template = args[++i];
    } else if (args[i] === '--field' && args[i + 1]) {
      field = args[++i];
    } else if (args[i] === '--missing' && args[i + 1]) {
      missingValue = args[++i];
    } else if (!args[i].startsWith('--')) {
      inputFile = args[i];
    }
  }

  if (!template) {
    printUsage();
    process.exit(1);
  }

  return { template, field, missingValue, inputFile };
}

async function main(): Promise<void> {
  const opts = parseTemplateArgs(process.argv);
  const input = opts.inputFile
    ? fs.createReadStream(opts.inputFile)
    : process.stdin;

  const rl = readline.createInterface({ input, crlfDelay: Infinity });

  for await (const line of rl) {
    if (!line.trim()) continue;
    const entry = parseLogLine(line);
    if (!entry) continue;

    if (opts.field) {
      const enriched = enrichWithTemplate([entry], opts.field, {
        template: opts.template,
        missingValue: opts.missingValue,
      });
      console.log(JSON.stringify(enriched[0]));
    } else {
      console.log(renderTemplate(opts.template, entry, opts.missingValue));
    }
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
