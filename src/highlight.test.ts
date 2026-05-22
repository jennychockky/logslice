import { highlightJson, defaultHighlightOptions, HighlightOptions } from "./highlight";

const RESET = "\x1b[0m";

describe("defaultHighlightOptions", () => {
  it("returns enabled options by default", () => {
    const opts = defaultHighlightOptions();
    expect(opts.enabled).toBe(true);
    expect(opts.keyColor).toBe("cyan");
  });

  it("respects enabled=false", () => {
    const opts = defaultHighlightOptions(false);
    expect(opts.enabled).toBe(false);
  });
});

describe("highlightJson", () => {
  const obj = { level: "info", count: 42, active: true, nothing: null };

  it("returns plain JSON when disabled", () => {
    const opts: HighlightOptions = { enabled: false };
    const result = highlightJson(obj, opts);
    expect(result).toBe(JSON.stringify(obj, null, 2));
    expect(result).not.toContain("\x1b[");
  });

  it("colorizes keys when enabled", () => {
    const opts = defaultHighlightOptions(true);
    const result = highlightJson(obj, opts);
    expect(result).toContain("\x1b[36m"); // cyan for keys
    expect(result).toContain(RESET);
  });

  it("colorizes string values", () => {
    const opts = defaultHighlightOptions(true);
    const result = highlightJson({ msg: "hello" }, opts);
    expect(result).toContain("\x1b[32m"); // green for strings
  });

  it("colorizes number values", () => {
    const opts = defaultHighlightOptions(true);
    const result = highlightJson({ n: 7 }, opts);
    expect(result).toContain("\x1b[35m"); // magenta for numbers
  });

  it("colorizes boolean values", () => {
    const opts = defaultHighlightOptions(true);
    const result = highlightJson({ flag: false }, opts);
    expect(result).toContain("\x1b[33m"); // yellow for bools
  });

  it("colorizes null values", () => {
    const opts = defaultHighlightOptions(true);
    const result = highlightJson({ x: null }, opts);
    expect(result).toContain("\x1b[90m"); // gray for null
  });

  it("handles empty object", () => {
    const opts = defaultHighlightOptions(true);
    const result = highlightJson({}, opts);
    expect(result).toBe("{}");
  });
});
