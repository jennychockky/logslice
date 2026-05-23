import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { execSync } from "child_process";
import { parseRepairArgs } from "./cli-repair";

function writeTempFile(content: string): string {
  const file = path.join(os.tmpdir(), `logslice-repair-test-${Date.now()}.log`);
  fs.writeFileSync(file, content, "utf8");
  return file;
}

describe("parseRepairArgs", () => {
  it("parses file arguments", () => {
    const args = parseRepairArgs(["file1.log", "file2.log"]);
    expect(args.files).toEqual(["file1.log", "file2.log"]);
    expect(args.strict).toBe(false);
    expect(args.summary).toBe(false);
    expect(args.output).toBeNull();
  });

  it("parses --output flag", () => {
    const args = parseRepairArgs(["--output", "out.log", "input.log"]);
    expect(args.output).toBe("out.log");
    expect(args.files).toEqual(["input.log"]);
  });

  it("parses -o shorthand", () => {
    const args = parseRepairArgs(["-o", "result.log"]);
    expect(args.output).toBe("result.log");
  });

  it("parses --strict flag", () => {
    const args = parseRepairArgs(["--strict", "file.log"]);
    expect(args.strict).toBe(true);
  });

  it("parses --summary flag", () => {
    const args = parseRepairArgs(["--summary"]);
    expect(args.summary).toBe(true);
  });

  it("parses combined flags", () => {
    const args = parseRepairArgs(["--strict", "--summary", "-o", "out.log", "a.log"]);
    expect(args.strict).toBe(true);
    expect(args.summary).toBe(true);
    expect(args.output).toBe("out.log");
    expect(args.files).toEqual(["a.log"]);
  });

  it("returns empty files array with no positional args", () => {
    const args = parseRepairArgs(["--strict"]);
    expect(args.files).toEqual([]);
  });
});

describe("cli-repair integration", () => {
  it("repairs and outputs valid JSON lines", () => {
    const content = [
      '{"level":"info","msg":"ok","time":"2024-01-01T00:00:00Z"}',
      '{"level":"error","msg":"bad json"',
    ].join("\n") + "\n";
    const input = writeTempFile(content);
    const output = path.join(os.tmpdir(), `logslice-repair-out-${Date.now()}.log`);
    try {
      execSync(`npx ts-node src/cli-repair.ts --output ${output} ${input}`, { stdio: "pipe" });
      const result = fs.readFileSync(output, "utf8").trim();
      expect(result.length).toBeGreaterThan(0);
      const lines = result.split("\n").filter(Boolean);
      lines.forEach((line) => expect(() => JSON.parse(line)).not.toThrow());
    } finally {
      fs.unlinkSync(input);
      if (fs.existsSync(output)) fs.unlinkSync(output);
    }
  });
});
