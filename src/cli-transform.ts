/**
 * cli-transform.ts — CLI argument parsing for transform options.
 */

import { TransformOptions } from "./transform";

export interface RawTransformArgs {
  rename?: string[];
  redact?: string[];
  pick?: string[];
  omit?: string[];
}

/**
 * Parse a "key=value" rename pair into a [from, to] tuple.
 */
export function parseRenamePair(pair: string): [string, string] {
  const idx = pair.indexOf("=");
  if (idx === -1) {
    throw new Error(`Invalid rename pair "${pair}": expected format "from=to"`);
  }
  const from = pair.slice(0, idx).trim();
  const to = pair.slice(idx + 1).trim();
  if (!from || !to) {
    throw new Error(`Invalid rename pair "${pair}": both sides must be non-empty`);
  }
  return [from, to];
}

/**
 * Build a TransformOptions object from raw CLI arguments.
 */
export function buildTransformOptions(args: RawTransformArgs): TransformOptions {
  const options: TransformOptions = {};

  if (args.rename && args.rename.length > 0) {
    const rename: Record<string, string> = {};
    for (const pair of args.rename) {
      const [from, to] = parseRenamePair(pair);
      rename[from] = to;
    }
    options.rename = rename;
  }

  if (args.redact && args.redact.length > 0) {
    options.redact = args.redact;
  }

  if (args.pick && args.pick.length > 0) {
    options.pick = args.pick;
  }

  if (args.omit && args.omit.length > 0) {
    options.omit = args.omit;
  }

  return options;
}

/**
 * Return yargs-style option definitions for transform-related CLI flags.
 */
export function transformCliOptions() {
  return {
    rename: {
      type: "array" as const,
      describe: 'Rename fields, e.g. --rename message=msg',
      default: [] as string[],
    },
    redact: {
      type: "array" as const,
      describe: 'Redact field values, e.g. --redact password token',
      default: [] as string[],
    },
    pick: {
      type: "array" as const,
      describe: 'Keep only these fields in output',
      default: [] as string[],
    },
    omit: {
      type: "array" as const,
      describe: 'Remove these fields from output',
      default: [] as string[],
    },
  };
}
