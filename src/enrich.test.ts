import {
  enrichWithStatic,
  enrichWithTimestamp,
  enrichWithIndex,
  enrichEntry,
  enrichEntries,
} from "./enrich";

const base = { level: "info", message: "hello" };

describe("enrichWithStatic", () => {
  it("merges static fields into entry", () => {
    const result = enrichWithStatic(base, { env: "prod", app: "api" });
    expect(result.env).toBe("prod");
    expect(result.app).toBe("api");
    expect(result.level).toBe("info");
  });

  it("does not mutate original entry", () => {
    enrichWithStatic(base, { env: "prod" });
    expect((base as Record<string, unknown>).env).toBeUndefined();
  });

  it("overwrites existing fields", () => {
    const result = enrichWithStatic(base, { level: "error" });
    expect(result.level).toBe("error");
  });
});

describe("enrichWithTimestamp", () => {
  it("adds default _enriched_at field", () => {
    const result = enrichWithTimestamp(base);
    expect(typeof result._enriched_at).toBe("string");
    expect(() => new Date(result._enriched_at as string)).not.toThrow();
  });

  it("uses custom field name", () => {
    const result = enrichWithTimestamp(base, "processed_at");
    expect(result.processed_at).toBeDefined();
    expect(result._enriched_at).toBeUndefined();
  });
});

describe("enrichWithIndex", () => {
  it("adds _index field", () => {
    const result = enrichWithIndex(base, 5);
    expect(result._index).toBe(5);
  });

  it("uses custom field name", () => {
    const result = enrichWithIndex(base, 3, "seq");
    expect(result.seq).toBe(3);
    expect(result._index).toBeUndefined();
  });
});

describe("enrichEntry", () => {
  it("applies all options", () => {
    const result = enrichEntry(base, 0, {
      staticFields: { env: "test" },
      addTimestamp: true,
      addIndex: true,
    });
    expect(result.env).toBe("test");
    expect(result._enriched_at).toBeDefined();
    expect(result._index).toBe(0);
  });

  it("applies no changes when options are empty", () => {
    const result = enrichEntry(base, 0, {});
    expect(result).toEqual(base);
  });
});

describe("enrichEntries", () => {
  it("enriches all entries with correct index", () => {
    const entries = [{ msg: "a" }, { msg: "b" }, { msg: "c" }];
    const results = enrichEntries(entries, { addIndex: true });
    expect(results[0]._index).toBe(0);
    expect(results[1]._index).toBe(1);
    expect(results[2]._index).toBe(2);
  });

  it("returns empty array for empty input", () => {
    expect(enrichEntries([], { staticFields: { x: 1 } })).toEqual([]);
  });
});
