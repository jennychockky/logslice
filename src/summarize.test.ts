import {
  collectFields,
  summarizeField,
  getTimeRange,
  summarizeEntries,
  formatSummary,
} from "./summarize";
import { LogEntry } from "./parser";

const entries: LogEntry[] = [
  { timestamp: "2024-01-01T00:00:00Z", level: "info", service: "api", msg: "started" },
  { timestamp: "2024-01-01T01:00:00Z", level: "warn", service: "api", msg: "slow" },
  { timestamp: "2024-01-01T02:00:00Z", level: "error", service: "db", msg: "failed" },
  { timestamp: "2024-01-01T03:00:00Z", level: "info", service: "db", msg: "retry" },
  { timestamp: "2024-01-01T04:00:00Z", level: "info", service: "api", msg: "ok" },
];

describe("collectFields", () => {
  it("returns sorted unique fields from all entries", () => {
    const fields = collectFields(entries);
    expect(fields).toEqual(["level", "msg", "service", "timestamp"]);
  });

  it("returns empty array for no entries", () => {
    expect(collectFields([])).toEqual([]);
  });
});

describe("summarizeField", () => {
  it("counts occurrences of each value", () => {
    const summary = summarizeField(entries, "service");
    expect(summary.uniqueValues).toBe(2);
    expect(summary.topValues[0]).toEqual({ value: "api", count: 3 });
    expect(summary.topValues[1]).toEqual({ value: "db", count: 2 });
  });

  it("respects topN limit", () => {
    const summary = summarizeField(entries, "level", 2);
    expect(summary.topValues.length).toBeLessThanOrEqual(2);
  });

  it("handles missing field gracefully", () => {
    const summary = summarizeField(entries, "nonexistent");
    expect(summary.uniqueValues).toBe(0);
    expect(summary.topValues).toEqual([]);
  });
});

describe("getTimeRange", () => {
  it("returns earliest and latest timestamps", () => {
    const range = getTimeRange(entries);
    expect(range).toEqual({
      earliest: "2024-01-01T00:00:00Z",
      latest: "2024-01-01T04:00:00Z",
    });
  });

  it("returns undefined when no timestamp fields exist", () => {
    const noTime: LogEntry[] = [{ level: "info", msg: "hello" }];
    expect(getTimeRange(noTime)).toBeUndefined();
  });

  it("returns undefined for empty entries", () => {
    expect(getTimeRange([])).toBeUndefined();
  });
});

describe("summarizeEntries", () => {
  it("returns total entry count", () => {
    const summary = summarizeEntries(entries);
    expect(summary.totalEntries).toBe(5);
  });

  it("includes all fields", () => {
    const summary = summarizeEntries(entries);
    expect(summary.fields).toContain("level");
    expect(summary.fields).toContain("service");
  });

  it("includes time range", () => {
    const summary = summarizeEntries(entries);
    expect(summary.timeRange).toBeDefined();
  });
});

describe("formatSummary", () => {
  it("includes total entries in output", () => {
    const summary = summarizeEntries(entries);
    const output = formatSummary(summary);
    expect(output).toContain("5");
  });

  it("includes field names", () => {
    const summary = summarizeEntries(entries);
    const output = formatSummary(summary);
    expect(output).toContain("level");
    expect(output).toContain("service");
  });

  it("includes time range when present", () => {
    const summary = summarizeEntries(entries);
    const output = formatSummary(summary);
    expect(output).toContain("2024-01-01T00:00:00Z");
  });
});
