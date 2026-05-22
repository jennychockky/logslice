import { parseSampleArgs } from "./cli-sample";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { runSample } from "./cli-sample";

function writeTempFile(content: string): string {
  const file = path.join(os.tmpdir(), `logslice-sample-test-${Date.now()}.ndjson`);
  fs.writeFileSync(file, content, "utf-8");
  return file;
}

describe("parseSampleArgs", () => {
  it("parses --rate", () => {
    const { options } = parseSampleArgs(["--rate", "0.25"]);
    expect(options.rate).toBeCloseTo(0.25);
  });

  it("parses --count", () => {
    const { options } = parseSampleArgs(["--count", "50"]);
    expect(options.count).toBe(50);
  });

  it("parses --seed", () => {
    const { options } = parseSampleArgs(["--seed", "42"]);
    expect(options.seed).toBe(42);
  });

  it("parses file argument", () => {
    const { file } = parseSampleArgs(["--rate", "0.5", "myfile.log"]);
    expect(file).toBe("myfile.log");
  });

  it("returns empty options for no args", () => {
    const { options, file } = parseSampleArgs([]);
    expect(options).toEqual({});
    expect(file).toBeUndefined();
  });

  it("parses all options together", () => {
    const { options } = parseSampleArgs(["--rate", "0.1", "--seed", "7"]);
    expect(options.rate).toBeCloseTo(0.1);
    expect(options.seed).toBe(7);
  });
});

describe("runSample integration", () => {
  let stdoutData: string;
  let originalWrite: typeof process.stdout.write;

  beforeEach(() => {
    stdoutData = "";
    originalWrite = process.stdout.write.bind(process.stdout);
    (process.stdout.write as unknown) = (chunk: string) => {
      stdoutData += chunk;
      return true;
    };
  });

  afterEach(() => {
    process.stdout.write = originalWrite;
  });

  it("outputs all entries when no options", async () => {
    const lines = Array.from({ length: 5 }, (_, i) =>
      JSON.stringify({ level: "info", msg: `msg-${i}`, time: "2024-01-01T00:00:00Z" })
    ).join("\n");
    const file = writeTempFile(lines);
    await runSample([file]);
    const output = stdoutData.trim().split("\n");
    expect(output).toHaveLength(5);
    fs.unlinkSync(file);
  });

  it("outputs exactly count entries", async () => {
    const lines = Array.from({ length: 20 }, (_, i) =>
      JSON.stringify({ level: "info", msg: `msg-${i}`, time: "2024-01-01T00:00:00Z" })
    ).join("\n");
    const file = writeTempFile(lines);
    await runSample(["--count", "5", "--seed", "1", file]);
    const output = stdoutData.trim().split("\n");
    expect(output).toHaveLength(5);
    fs.unlinkSync(file);
  });
});
