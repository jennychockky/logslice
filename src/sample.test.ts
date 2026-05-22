import {
  createRng,
  sampleByRate,
  sampleByCount,
  sampleEntries,
  LogEntry,
} from "./sample";

const makeEntries = (n: number): LogEntry[] =>
  Array.from({ length: n }, (_, i) => ({ id: i, msg: `log-${i}` }));

describe("createRng", () => {
  it("produces deterministic values for the same seed", () => {
    const rng1 = createRng(42);
    const rng2 = createRng(42);
    expect(rng1()).toBeCloseTo(rng2());
    expect(rng1()).toBeCloseTo(rng2());
  });

  it("produces values in [0, 1)", () => {
    const rng = createRng(99);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});

describe("sampleByRate", () => {
  it("returns empty array for rate 0", () => {
    expect(sampleByRate(makeEntries(10), 0)).toHaveLength(0);
  });

  it("returns all entries for rate 1", () => {
    const entries = makeEntries(10);
    expect(sampleByRate(entries, 1)).toEqual(entries);
  });

  it("samples approximately correct proportion", () => {
    const entries = makeEntries(10000);
    const sampled = sampleByRate(entries, 0.1, createRng(7));
    expect(sampled.length).toBeGreaterThan(800);
    expect(sampled.length).toBeLessThan(1200);
  });
});

describe("sampleByCount", () => {
  it("returns empty for count 0", () => {
    expect(sampleByCount(makeEntries(10), 0)).toHaveLength(0);
  });

  it("returns all entries when count >= length", () => {
    const entries = makeEntries(5);
    expect(sampleByCount(entries, 10)).toHaveLength(5);
  });

  it("returns exactly count entries", () => {
    const entries = makeEntries(100);
    expect(sampleByCount(entries, 20, createRng(1))).toHaveLength(20);
  });

  it("is deterministic with same seed", () => {
    const entries = makeEntries(50);
    const a = sampleByCount(entries, 10, createRng(5));
    const b = sampleByCount(entries, 10, createRng(5));
    expect(a).toEqual(b);
  });
});

describe("sampleEntries", () => {
  it("returns all entries when no options", () => {
    const entries = makeEntries(5);
    expect(sampleEntries(entries, {})).toEqual(entries);
  });

  it("uses count option", () => {
    expect(sampleEntries(makeEntries(20), { count: 5, seed: 1 })).toHaveLength(5);
  });

  it("uses rate option", () => {
    const result = sampleEntries(makeEntries(1000), { rate: 0.5, seed: 42 });
    expect(result.length).toBeGreaterThan(400);
    expect(result.length).toBeLessThan(600);
  });

  it("prefers count over rate when both given", () => {
    const result = sampleEntries(makeEntries(100), { count: 10, rate: 0.9, seed: 3 });
    expect(result).toHaveLength(10);
  });
});
