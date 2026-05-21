import { FilterOptions } from './filter';

export interface CliArgs {
  input?: string;
  from?: string;
  to?: string;
  level?: string;
  field?: string[];
  output?: 'json' | 'pretty';
  help?: boolean;
}

export function parseCliArgs(argv: string[]): CliArgs {
  const args: CliArgs = {};
  const rest = argv.slice(2);

  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else if (arg === '--from' && rest[i + 1]) {
      args.from = rest[++i];
    } else if (arg === '--to' && rest[i + 1]) {
      args.to = rest[++i];
    } else if (arg === '--level' && rest[i + 1]) {
      args.level = rest[++i];
    } else if (arg === '--field' && rest[i + 1]) {
      if (!args.field) args.field = [];
      args.field.push(rest[++i]);
    } else if (arg === '--output' && rest[i + 1]) {
      args.output = rest[++i] as 'json' | 'pretty';
    } else if (!arg.startsWith('--') && !args.input) {
      args.input = arg;
    }
  }

  return args;
}

export function buildFilterOptions(args: CliArgs): FilterOptions {
  const options: FilterOptions = {};

  if (args.from) {
    const d = new Date(args.from);
    if (!isNaN(d.getTime())) options.from = d;
  }
  if (args.to) {
    const d = new Date(args.to);
    if (!isNaN(d.getTime())) options.to = d;
  }
  if (args.level) {
    options.level = args.level.split(',').map((l) => l.trim());
  }
  if (args.field && args.field.length > 0) {
    options.fields = {};
    for (const fieldSpec of args.field) {
      const eqIdx = fieldSpec.indexOf('=');
      if (eqIdx === -1) continue;
      const key = fieldSpec.slice(0, eqIdx);
      const val = fieldSpec.slice(eqIdx + 1);
      const isRegex = val.startsWith('/') && val.endsWith('/');
      options.fields[key] = isRegex
        ? new RegExp(val.slice(1, -1), 'i')
        : val;
    }
  }

  return options;
}

export const HELP_TEXT = `
Usage: logslice [file] [options]

Options:
  --from <date>       Start of time range (ISO 8601)
  --to <date>         End of time range (ISO 8601)
  --level <levels>    Comma-separated log levels (e.g. info,warn)
  --field <key=val>   Filter by field value or /regex/
  --output <format>   Output format: json (default) or pretty
  --help, -h          Show this help message
`.trim();
