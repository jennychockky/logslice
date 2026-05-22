import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { parseHighlightArgs, runHighlightCli } from "./cli-highlight";

function writeTempFile(content: string): string {
  const p = path.join(os.tmpdir(), `hl-test-${Date.now()}.ndjson`);
  fs.writeFileSync(p, content, "utf8");
  return p;
}

describe("parseHighlightArgs", () => {
  it("defaults to color enabled, no file", () => {
    const opts = parseHighlightArgs([]);
    expect(opts.noColor).toBe(false);
    expect(opts.inputFile).toBeUndefined();
  });

  it("parses --no-color", () => {
    const opts = parseHighlightArgs(["--no-color"]);
    expect(opts.noColor).toBe(true);
  });

  it("parses --file flag", () => {
    const opts = parseHighlightArgs(["--file", "/tmp/foo.ndjson"]);
    expect(opts.inputFile).toBe("/tmp/foo.ndjson");
  });

  it("parses -f shorthand", () => {
    const opts = parseHighlightArgs(["-f", "/tmp/bar.ndjson"]);
    expect(opts.inputFile).toBe("/tmp/bar.ndjson");
  });

  it("treats bare positional as file", () => {
    const opts = parseHighlightArgs(["/tmp/baz.ndjson"]);
    expect(opts.inputFile).toBe("/tmp/baz.ndjson");
  });
});

describe("runHighlightCli", () => {
  it("pretty-prints valid JSON lines with color", async () => {
    const file = writeTempFile(
      '{"level":"info","msg":"hello"}\n{"level":"error","msg":"oops"}\n'
    );
    const lines: string[] = [];
    await runHighlightCli([file], (l) => lines.push(l));
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain("\x1b["); // color codes present
    fs.unlinkSync(file);
  });

  it("passes through non-JSON lines unchanged", async () => {
    const file = writeTempFile("not json at all\n");
    const lines: string[] = [];
    await runHighlightCli([file], (l) => lines.push(l));
    expect(lines[0]).toBe("not json at all");
    fs.unlinkSync(file);
  });

  it("suppresses colors with --no-color", async () => {
    const file = writeTempFile('{"x":1}\n');
    const lines: string[] = [];
    await runHighlightCli(["--no-color", file], (l) => lines.push(l));
    expect(lines[0]).not.toContain("\x1b[");
    expect(lines[0]).toContain('"x"');
    fs.unlinkSync(file);
  });

  it("skips blank lines", async () => {
    const file = writeTempFile('{"a":1}\n\n{"b":2}\n');
    const lines: string[] = [];
    await runHighlightCli([file], (l) => lines.push(l));
    expect(lines).toHaveLength(2);
    fs.unlinkSync(file);
  });
});
