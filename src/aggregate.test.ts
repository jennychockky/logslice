import { groupEntries, aggregateEntries, formatAggregateResults } from "./aggregate";
import { LogEntry } from "./parser";

const makeEntry = (overrides: Partial<LogEntry> = {}): LogEntry => ({
  timestamp: "2024-01-01T00:00:00.000Z",
  level: "info",
  message: "test",
  ...overrides,
});

const entries: LogEntry[] = [
  makeEntry({ level: "info", service: "api", duration: 100 }),
  makeEntry({ level: "error", service: "db", duration: 200 }),
  makeEntry({ level: "info", service: "api", duration: 150 }),
  makeEntry({ level: "warn", service: "db", duration: 50 }),
  makeEntry({ level: "error", service: "api", duration: 300 }),
];

describe("groupEntries", () => {
  it("groups entries by a field", () => {
    const groups = groupEntries(entries, "level");
    expect(groups.get("info")?.length).toBe(2);
    expect(groups.get("error")?.length).toBe(2);
    expect(groups.get("warn")?.length).toBe(1);
  });

  it("groups missing field under __undefined__", () => {
    const e = [makeEntry({ level: "info" }), makeEntry()];
    delete (e[1] as any).level;
    const groups = groupEntries(e, "level");
    expect(groups.has("__undefined__")).toBe(true);
  });
});

describe("aggregateEntries", () => {
  it("returns count per group sorted by count desc", () => {
    const results = aggregateEntries(entries, { groupBy: "level" });
    expect(results[0].count).toBeGreaterThanOrEqual(results[1].count);
    const infoResult = results.find((r) => r.group === "info");
    expect(infoResult?.count).toBe(2);
  });

  it("computes sum when sumField is provided", () => {
    const results = aggregateEntries(entries, { groupBy: "service", sumField: "duration" });
    const apiResult = results.find((r) => r.group === "api");
    expect(apiResult?.sum).toBe(550);
    const dbResult = results.find((r) => r.group === "db");
    expect(dbResult?.sum).toBe(250);
  });

  it("ignores non-numeric values when summing", () => {
    const e = [makeEntry({ level: "info", score: "n/a" }), makeEntry({ level: "info", score: 10 })];
    const results = aggregateEntries(e, { groupBy: "level", sumField: "score" });
    expect(results[0].sum).toBe(10);
  });
});

describe("formatAggregateResults", () => {
  it("formats results without sum", () => {
    const results = aggregateEntries(entries, { groupBy: "level" });
    const output = formatAggregateResults(results);
    expect(output).toContain("info: 2 entries");
    expect(output).toContain("error: 2 entries");
  });

  it("includes sum when sumField provided", () => {
    const results = aggregateEntries(entries, { groupBy: "service", sumField: "duration" });
    const output = formatAggregateResults(results, "duration");
    expect(output).toContain("sum(duration)=550");
  });
});
