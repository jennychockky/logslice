import { repairJsonLine, repairLines } from "./repair";

describe("repairJsonLine", () => {
  it("returns valid JSON unchanged", () => {
    const line = '{"level":"info","msg":"hello"}';
    expect(repairJsonLine(line)).toBe(line);
  });

  it("repairs missing closing brace", () => {
    const line = '{"level":"info","msg":"hello"';
    const result = repairJsonLine(line);
    expect(result).not.toBeNull();
    expect(() => JSON.parse(result!)).not.toThrow();
  });

  it("repairs trailing comma before closing brace", () => {
    const line = '{"level":"info","msg":"hello",}';
    const result = repairJsonLine(line);
    expect(result).not.toBeNull();
    const parsed = JSON.parse(result!);
    expect(parsed.level).toBe("info");
  });

  it("returns null for non-JSON lines", () => {
    expect(repairJsonLine("plain text log line")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(repairJsonLine("")).toBeNull();
  });

  it("handles single-quoted keys by returning null", () => {
    const result = repairJsonLine("{'level':'info'}");
    // single quotes are not valid JSON and cannot be trivially repaired
    expect(result).toBeNull();
  });

  it("repairs truncated string value", () => {
    const line = '{"level":"info","msg":"truncated';
    const result = repairJsonLine(line);
    expect(result).not.toBeNull();
    expect(() => JSON.parse(result!)).not.toThrow();
  });
});

describe("repairLines", () => {
  it("separates repaired and failed lines", () => {
    const lines = [
      '{"level":"info","msg":"ok"}',
      '{"level":"warn","msg":"missing brace"',
      "not json at all",
    ];
    const { repaired, failed } = repairLines(lines);
    expect(repaired.length).toBeGreaterThanOrEqual(1);
    expect(failed.length).toBeGreaterThanOrEqual(1);
  });

  it("returns all lines as repaired when all valid", () => {
    const lines = [
      '{"level":"info","msg":"a"}',
      '{"level":"error","msg":"b"}',
    ];
    const { repaired, failed } = repairLines(lines);
    expect(repaired).toHaveLength(2);
    expect(failed).toHaveLength(0);
  });

  it("returns all lines as failed when none parseable", () => {
    const lines = ["foo bar", "baz qux"];
    const { repaired, failed } = repairLines(lines);
    expect(repaired).toHaveLength(0);
    expect(failed).toHaveLength(2);
  });

  it("preserves original line in failed entries", () => {
    const lines = ["not json"];
    const { failed } = repairLines(lines);
    expect(failed[0].original).toBe("not json");
  });

  it("handles empty input", () => {
    const { repaired, failed } = repairLines([]);
    expect(repaired).toHaveLength(0);
    expect(failed).toHaveLength(0);
  });
});
