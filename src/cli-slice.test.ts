import { parseSliceArgs } from "./cli-slice";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

function writeTempFile(content: string): string {
  const tmpFile = path.join(os.tmpdir(), `logslice-test-${Date.now()}.ndjson`);
  fs.writeFileSync(tmpFile, content, "utf8");
  return tmpFile;
}

describe("parseSliceArgs", () => {
  it("parses --head option", () => {
    const opts = parseSliceArgs(["node", "cli-slice.ts", "--head", "10"]);
    expect(opts.head).toBe(10);
  });

  it("parses --tail option", () => {
    const opts = parseSliceArgs(["node", "cli-slice.ts", "--tail", "5"]);
    expect(opts.tail).toBe(5);
  });

  it("parses --from and --to options", () => {
    const opts = parseSliceArgs(["node", "cli-slice.ts", "--from", "2", "--to", "8"]);
    expect(opts.from).toBe(2);
    expect(opts.to).toBe(8);
  });

  it("parses --pretty flag", () => {
    const opts = parseSliceArgs(["node", "cli-slice.ts", "--pretty"]);
    expect(opts.pretty).toBe(true);
  });

  it("defaults pretty to false", () => {
    const opts = parseSliceArgs(["node", "cli-slice.ts"]);
    expect(opts.pretty).toBe(false);
  });

  it("parses file argument", () => {
    const opts = parseSliceArgs(["node", "cli-slice.ts", "logs.ndjson"]);
    expect(opts.file).toBe("logs.ndjson");
  });

  it("parses combined options and file", () => {
    const opts = parseSliceArgs(["node", "cli-slice.ts", "--head", "3", "--pretty", "logs.ndjson"]);
    expect(opts.head).toBe(3);
    expect(opts.pretty).toBe(true);
    expect(opts.file).toBe("logs.ndjson");
  });

  it("returns undefined for unspecified numeric options", () => {
    const opts = parseSliceArgs(["node", "cli-slice.ts"]);
    expect(opts.head).toBeUndefined();
    expect(opts.tail).toBeUndefined();
    expect(opts.from).toBeUndefined();
    expect(opts.to).toBeUndefined();
  });
});

describe("writeTempFile helper", () => {
  it("creates a readable temp file", () => {
    const content = '{"level":"info","msg":"test"}\n';
    const tmpFile = writeTempFile(content);
    const read = fs.readFileSync(tmpFile, "utf8");
    expect(read).toBe(content);
    fs.unlinkSync(tmpFile);
  });
});
