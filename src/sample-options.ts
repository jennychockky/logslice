/**
 * sample-options.ts — Validation and documentation helpers for SampleOptions
 */

import { SampleOptions } from "./sample";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate a SampleOptions object and return a result with any errors.
 */
export function validateSampleOptions(options: SampleOptions): ValidationResult {
  const errors: string[] = [];

  if (options.rate !== undefined) {
    if (typeof options.rate !== "number" || isNaN(options.rate)) {
      errors.push("rate must be a number");
    } else if (options.rate < 0 || options.rate > 1) {
      errors.push("rate must be between 0.0 and 1.0");
    }
  }

  if (options.count !== undefined) {
    if (!Number.isInteger(options.count) || options.count < 0) {
      errors.push("count must be a non-negative integer");
    }
  }

  if (options.seed !== undefined) {
    if (!Number.isInteger(options.seed)) {
      errors.push("seed must be an integer");
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Describe what sampling will be applied, for logging/debug purposes.
 */
export function describeSampleOptions(options: SampleOptions): string {
  if (options.count !== undefined) {
    const seedNote = options.seed !== undefined ? ` (seed: ${options.seed})` : "";
    return `reservoir sample: ${options.count} entries${seedNote}`;
  }
  if (options.rate !== undefined) {
    const pct = (options.rate * 100).toFixed(1);
    const seedNote = options.seed !== undefined ? ` (seed: ${options.seed})` : "";
    return `rate sample: ${pct}%${seedNote}`;
  }
  return "no sampling (pass-through)";
}

/**
 * Merge two SampleOptions objects; explicit values in `override` take precedence.
 */
export function mergeSampleOptions(
  base: SampleOptions,
  override: SampleOptions
): SampleOptions {
  return {
    ...base,
    ...Object.fromEntries(
      Object.entries(override).filter(([, v]) => v !== undefined)
    ),
  };
}
