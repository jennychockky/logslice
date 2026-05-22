import { parseRenamePair, buildTransformOptions, RawTransformArgs } from "./cli-transform";

describe("parseRenamePair", () => {
  it("parses a valid from=to pair", () => {
    expect(parseRenamePair("message=msg")).toEqual(["message", "msg"]);
  });

  it("handles keys with underscores and dots", () => {
    expect(parseRenamePair("log.level=severity")).toEqual(["log.level", "severity"]);
  });

  it("throws on missing equals sign", () => {
    expect(() => parseRenamePair("messageMsg")).toThrow(/expected format/);
  });

  it("throws on empty left side", () => {
    expect(() => parseRenamePair("=msg")).toThrow(/non-empty/);
  });

  it("throws on empty right side", () => {
    expect(() => parseRenamePair("message=")).toThrow(/non-empty/);
  });
});

describe("buildTransformOptions", () => {
  it("returns empty options for empty args", () => {
    const opts = buildTransformOptions({});
    expect(opts).toEqual({});
  });

  it("parses rename pairs into a record", () => {
    const opts = buildTransformOptions({ rename: ["message=msg", "level=severity"] });
    expect(opts.rename).toEqual({ message: "msg", level: "severity" });
  });

  it("passes through redact fields", () => {
    const opts = buildTransformOptions({ redact: ["password", "token"] });
    expect(opts.redact).toEqual(["password", "token"]);
  });

  it("passes through pick fields", () => {
    const opts = buildTransformOptions({ pick: ["timestamp", "level"] });
    expect(opts.pick).toEqual(["timestamp", "level"]);
  });

  it("passes through omit fields", () => {
    const opts = buildTransformOptions({ omit: ["debug", "internal"] });
    expect(opts.omit).toEqual(["debug", "internal"]);
  });

  it("ignores empty arrays", () => {
    const args: RawTransformArgs = { rename: [], redact: [], pick: [], omit: [] };
    const opts = buildTransformOptions(args);
    expect(opts.rename).toBeUndefined();
    expect(opts.redact).toBeUndefined();
    expect(opts.pick).toBeUndefined();
    expect(opts.omit).toBeUndefined();
  });

  it("throws on invalid rename pair", () => {
    expect(() => buildTransformOptions({ rename: ["badpair"] })).toThrow(/expected format/);
  });

  it("combines all options together", () => {
    const opts = buildTransformOptions({
      rename: ["msg=message"],
      redact: ["password"],
      pick: ["timestamp", "level", "message"],
      omit: ["debug"],
    });
    expect(opts.rename).toEqual({ msg: "message" });
    expect(opts.redact).toEqual(["password"]);
    expect(opts.pick).toEqual(["timestamp", "level", "message"]);
    expect(opts.omit).toEqual(["debug"]);
  });
});
