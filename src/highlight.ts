/**
 * highlight.ts — utilities for syntax-highlighting JSON log fields in terminal output
 */

export interface HighlightOptions {
  enabled: boolean;
  keyColor?: string;
  stringColor?: string;
  numberColor?: string;
  boolColor?: string;
  nullColor?: string;
}

const RESET = "\x1b[0m";
const COLORS: Record<string, string> = {
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  magenta: "\x1b[35m",
  gray: "\x1b[90m",
};

function color(text: string, name: string): string {
  return `${COLORS[name] ?? ""}${text}${RESET}`;
}

export function highlightJson(
  obj: Record<string, unknown>,
  opts: HighlightOptions
): string {
  if (!opts.enabled) {
    return JSON.stringify(obj, null, 2);
  }

  const raw = JSON.stringify(obj, null, 2);
  return raw.replace(
    /(?:("[^"]+")\s*:)|(?::\s*("[^"]*"|true|false|null|-?\d+(?:\.\d+)?))/g,
    (match, key, value) => {
      if (key) {
        return match.replace(key, color(key, opts.keyColor ?? "cyan"));
      }
      if (value === undefined) return match;
      if (value === "true" || value === "false") {
        return match.replace(value, color(value, opts.boolColor ?? "yellow"));
      }
      if (value === "null") {
        return match.replace(value, color(value, opts.nullColor ?? "gray"));
      }
      if (/^-?\d/.test(value)) {
        return match.replace(value, color(value, opts.numberColor ?? "magenta"));
      }
      return match.replace(value, color(value, opts.stringColor ?? "green"));
    }
  );
}

export function defaultHighlightOptions(enabled = true): HighlightOptions {
  return {
    enabled,
    keyColor: "cyan",
    stringColor: "green",
    numberColor: "magenta",
    boolColor: "yellow",
    nullColor: "gray",
  };
}
