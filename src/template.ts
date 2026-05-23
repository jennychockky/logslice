/**
 * template.ts — Apply mustache-style templates to log entries
 */

export interface TemplateOptions {
  template: string;
  missingValue?: string;
}

const PLACEHOLDER_RE = /\{\{\s*([\w.]+)\s*\}\}/g;

/**
 * Resolve a dot-separated field path from an object.
 */
export function resolvePath(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc !== null && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

/**
 * Render a template string against a single log entry.
 */
export function renderTemplate(
  template: string,
  entry: Record<string, unknown>,
  missingValue = ''
): string {
  return template.replace(PLACEHOLDER_RE, (_match, path: string) => {
    const value = resolvePath(entry, path);
    if (value === undefined || value === null) return missingValue;
    return String(value);
  });
}

/**
 * Render a template against each entry, returning an array of strings.
 */
export function renderTemplates(
  entries: Record<string, unknown>[],
  options: TemplateOptions
): string[] {
  return entries.map((entry) =>
    renderTemplate(options.template, entry, options.missingValue ?? '')
  );
}

/**
 * Add a new field to each entry whose value is the rendered template.
 */
export function enrichWithTemplate(
  entries: Record<string, unknown>[],
  field: string,
  options: TemplateOptions
): Record<string, unknown>[] {
  return entries.map((entry) => ({
    ...entry,
    [field]: renderTemplate(options.template, entry, options.missingValue ?? ''),
  }));
}
