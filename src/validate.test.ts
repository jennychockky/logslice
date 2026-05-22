import {
  validateEntry,
  validateEntries,
  filterValidEntries,
  parseSchema,
} from "./validate";

describe("validateEntry", () => {
  const schema = {
    level: { type: "string" as const, required: true },
    timestamp: { type: "string" as const, required: true },
    count: { type: "number" as const },
  };

  it("passes a valid entry", () => {
    const result = validateEntry(
      { level: "info", timestamp: "2024-01-01T00:00:00Z", count: 5 },
      schema
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("fails when required field is missing", () => {
    const result = validateEntry({ level: "info" }, schema);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing required field: "timestamp"');
  });

  it("fails on type mismatch", () => {
    const result = validateEntry(
      { level: "info", timestamp: "2024-01-01T00:00:00Z", count: "five" },
      schema
    );
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/expected type number, got string/);
  });

  it("allows missing optional fields", () => {
    const result = validateEntry(
      { level: "info", timestamp: "2024-01-01T00:00:00Z" },
      schema
    );
    expect(result.valid).toBe(true);
  });

  it("detects array type correctly", () => {
    const s = { tags: { type: "array" as const, required: true } };
    expect(validateEntry({ tags: ["a", "b"] }, s).valid).toBe(true);
    expect(validateEntry({ tags: {} }, s).valid).toBe(false);
  });
});

describe("validateEntries", () => {
  it("returns results for each entry", () => {
    const schema = { msg: { type: "string" as const, required: true } };
    const results = validateEntries([{ msg: "hi" }, { msg: 42 }], schema);
    expect(results[0].result.valid).toBe(true);
    expect(results[1].result.valid).toBe(false);
  });
});

describe("filterValidEntries", () => {
  it("keeps only valid entries", () => {
    const schema = { level: { type: "string" as const, required: true } };
    const entries = [{ level: "info" }, { level: 0 }, {}];
    const valid = filterValidEntries(entries, schema);
    expect(valid).toHaveLength(1);
    expect(valid[0].level).toBe("info");
  });
});

describe("parseSchema", () => {
  it("parses a schema string", () => {
    const schema = parseSchema("level:!string,count:number");
    expect(schema.level).toEqual({ type: "string", required: true });
    expect(schema.count).toEqual({ type: "number", required: false });
  });

  it("ignores malformed parts", () => {
    const schema = parseSchema("level:!string,badpart");
    expect(Object.keys(schema)).toEqual(["level"]);
  });
});
