import {
  flattenObject,
  flattenEntry,
  flattenEntries,
  unflattenObject,
} from "./flatten";

describe("flattenObject", () => {
  it("returns flat object unchanged", () => {
    const input = { a: 1, b: "hello", c: true };
    expect(flattenObject(input)).toEqual({ a: 1, b: "hello", c: true });
  });

  it("flattens one level of nesting", () => {
    const input = { a: { b: 1, c: 2 } };
    expect(flattenObject(input)).toEqual({ "a.b": 1, "a.c": 2 });
  });

  it("flattens multiple levels of nesting", () => {
    const input = { a: { b: { c: 42 } } };
    expect(flattenObject(input)).toEqual({ "a.b.c": 42 });
  });

  it("handles mixed nested and flat fields", () => {
    const input = { level: "info", meta: { host: "srv1", port: 8080 } };
    expect(flattenObject(input)).toEqual({
      level: "info",
      "meta.host": "srv1",
      "meta.port": 8080,
    });
  });

  it("preserves arrays as-is", () => {
    const input = { tags: ["a", "b"], nested: { arr: [1, 2] } };
    expect(flattenObject(input)).toEqual({
      tags: ["a", "b"],
      "nested.arr": [1, 2],
    });
  });

  it("preserves null values", () => {
    const input = { a: null, b: { c: null } };
    expect(flattenObject(input)).toEqual({ a: null, "b.c": null });
  });

  it("supports custom separator", () => {
    const input = { a: { b: 1 } };
    expect(flattenObject(input, "", "_")).toEqual({ a_b: 1 });
  });
});

describe("flattenEntry", () => {
  it("flattens a log entry", () => {
    const entry = { timestamp: "2024-01-01", context: { userId: "u1" } };
    expect(flattenEntry(entry)).toEqual({
      timestamp: "2024-01-01",
      "context.userId": "u1",
    });
  });
});

describe("flattenEntries", () => {
  it("flattens multiple entries", () => {
    const entries = [
      { a: { b: 1 } },
      { a: { b: 2 } },
    ];
    expect(flattenEntries(entries)).toEqual([{ "a.b": 1 }, { "a.b": 2 }]);
  });

  it("returns empty array for empty input", () => {
    expect(flattenEntries([])).toEqual([]);
  });
});

describe("unflattenObject", () => {
  it("rebuilds nested structure from dot keys", () => {
    const input = { "a.b": 1, "a.c": 2 };
    expect(unflattenObject(input)).toEqual({ a: { b: 1, c: 2 } });
  });

  it("handles deeply nested keys", () => {
    const input = { "a.b.c": 42 };
    expect(unflattenObject(input)).toEqual({ a: { b: { c: 42 } } });
  });

  it("leaves flat keys unchanged", () => {
    const input = { level: "info", msg: "hello" };
    expect(unflattenObject(input)).toEqual({ level: "info", msg: "hello" });
  });

  it("supports custom separator", () => {
    const input = { a_b: 1 };
    expect(unflattenObject(input, "_")).toEqual({ a: { b: 1 } });
  });
});
