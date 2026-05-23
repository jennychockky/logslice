import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { parseEnrichArgs } from "./cli-enrich";

function writeTempFile(content: string): string {
  const file = path.join(os.tmpdir(), `enrich-test-${Date.now()}.ndjson`);
  fs.writeFileSync(file, content, "utf-8");
  return file;
}

describe("parseEnrichArgs", () => {
  it("parses file argument", () => {
    const file = writeTempFile('{"level":"info"}\n');
    const result = parseEnrichArgs(["node", "cli-enrich", file]);
    expect(result.file).toBe(file);
  });

  it("parses --set key=value", () => {
    const file = writeTempFile("");
    const result = parseEnrichArgs([
      "node", "cli-enrich", "--set", "env=prod", file,
    ]);
    expect(result.options.staticFields).toEqual({ env: "prod" });
  });

  it("parses multiple --set flags", () => {
    const file = writeTempFile("");
    const result = parseEnrichArgs([
      "node", "cli-enrich", "--set", "env=prod", "--set", "app=api", file,
    ]);
    expect(result.options.staticFields).toEqual({ env: "prod", app: "api" });
  });

  it("parses --add-timestamp", () => {
    const file = writeTempFile("");
    const result = parseEnrichArgs(["node", "cli-enrich", "--add-timestamp", file]);
    expect(result.options.addTimestamp).toBe(true);
  });

  it("parses --timestamp-field", () => {
    const file = writeTempFile("");
    const result = parseEnrichArgs([
      "node", "cli-enrich", "--add-timestamp", "--timestamp-field", "ts", file,
    ]);
    expect(result.options.timestampField).toBe("ts");
  });

  it("parses --add-index", () => {
    const file = writeTempFile("");
    const result = parseEnrichArgs(["node", "cli-enrich", "--add-index", file]);
    expect(result.options.addIndex).toBe(true);
  });

  it("parses --index-field", () => {
    const file = writeTempFile("");
    const result = parseEnrichArgs([
      "node", "cli-enrich", "--add-index", "--index-field", "seq", file,
    ]);
    expect(result.options.indexField).toBe("seq");
  });

  it("defaults addTimestamp to false when not specified", () => {
    const file = writeTempFile("");
    const result = parseEnrichArgs(["node", "cli-enrich", file]);
    expect(result.options.addTimestamp).toBeFalsy();
  });

  it("defaults addIndex to false when not specified", () => {
    const file = writeTempFile("");
    const result = parseEnrichArgs(["node", "cli-enrich", file]);
    expect(result.options.addIndex).toBeFalsy();
  });

  it("throws when no file is provided", () => {
    expect(() => parseEnrichArgs(["node", "cli-enrich", "--add-index"])).toThrow(
      "No input file specified"
    );
  });

  it("throws on invalid --set value", () => {
    expect(() =>
      parseEnrichArgs(["node", "cli-enrich", "--set", "badvalue", "file.ndjson"])
    ).toThrow("Invalid --set value");
  });
});
