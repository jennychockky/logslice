/**
 * template-options.ts — Validation and description helpers for template options
 */

import { TemplateOptions } from './template';

export interface FullTemplateOptions extends TemplateOptions {
  field?: string;
}

/**
 * Validate that template options are well-formed.
 * Returns a list of error strings (empty if valid).
 */
export function validateTemplateOptions(opts: Partial<FullTemplateOptions>): string[] {
  const errors: string[] = [];

  if (!opts.template || opts.template.trim() === '') {
    errors.push('template must be a non-empty string');
  }

  if (opts.field !== undefined && opts.field.trim() === '') {
    errors.push('field must be a non-empty string when provided');
  }

  return errors;
}

/**
 * Return a human-readable description of the template options.
 */
export function describeTemplateOptions(opts: FullTemplateOptions): string {
  const parts: string[] = [`template: "${opts.template}"`];
  if (opts.field) parts.push(`output field: "${opts.field}"`);
  if (opts.missingValue !== undefined && opts.missingValue !== '') {
    parts.push(`missing value: "${opts.missingValue}"`);
  }
  return parts.join(', ');
}

/**
 * Merge partial options with defaults.
 */
export function mergeTemplateOptions(
  opts: Partial<FullTemplateOptions>
): FullTemplateOptions {
  return {
    template: opts.template ?? '',
    missingValue: opts.missingValue ?? '',
    field: opts.field,
  };
}
