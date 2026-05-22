/**
 * Validate log entries against a set of required fields and type constraints.
 */

export interface FieldSchema {
  type: "string" | "number" | "boolean" | "object" | "array";
  required?: boolean;
}

export interface ValidationSchema {
  [field: string]: FieldSchema;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateEntry(
  entry: Record<string, unknown>,
  schema: ValidationSchema
): ValidationResult {
  const errors: string[] = [];

  for (const [field, def] of Object.entries(schema)) {
    const value = entry[field];

    if (def.required && (value === undefined || value === null)) {
      errors.push(`Missing required field: "${field}"`);
      continue;
    }

    if (value !== undefined && value !== null) {
      const actualType = Array.isArray(value) ? "array" : typeof value;
      if (actualType !== def.type) {
        errors.push(
          `Field "${field}" expected type ${def.type}, got ${actualType}`
        );
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateEntries(
  entries: Record<string, unknown>[],
  schema: ValidationSchema
): { entry: Record<string, unknown>; result: ValidationResult }[] {
  return entries.map((entry) => ({
    entry,
    result: validateEntry(entry, schema),
  }));
}

export function filterValidEntries(
  entries: Record<string, unknown>[],
  schema: ValidationSchema
): Record<string, unknown>[] {
  return entries.filter((entry) => validateEntry(entry, schema).valid);
}

export function parseSchema(raw: string): ValidationSchema {
  // Format: "field:type,field:type,..." where type may be prefixed with "!" for required
  const schema: ValidationSchema = {};
  for (const part of raw.split(",")) {
    const [field, typeRaw] = part.trim().split(":");
    if (!field || !typeRaw) continue;
    const required = typeRaw.startsWith("!");
    const type = typeRaw.replace("!", "") as FieldSchema["type"];
    schema[field] = { type, required };
  }
  return schema;
}
