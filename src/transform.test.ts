import {
  renameFields,
  redactFields,
  pickFields,
  omitFields,
  transformEntry,
  transformEntries,
  LogEntry,
} from "./transform";

const sample: LogEntry = {
  timestamp: "2024-01-15T10:00:00Z",
  level: "info",
  message: "User logged in",
  userId: "u-123",
  password: "secret",
  ip: "192.168.1.1",
};

describe("renameFields", () => {
  it("renames a field", () => {
    const result = renameFields(sample, { message: "msg" });
    expect(result.msg).toBe("User logged in");
    expect(result.message).toBeUndefined();
  });

  it("ignores missing fields", () => {
    const result = renameFields(sample, { nonexistent: "other" });
    expect(result).not.toHaveProperty("other");
  });

  it("does not mutate original", () => {
    renameFields(sample, { level: "severity" });
    expect(sample.level).toBe("info");
  });
});

describe("redactFields", () => {
  it("replaces field value with [REDACTED]", () => {
    const result = redactFields(sample, ["password"]);
    expect(result.password).toBe("[REDACTED]");
  });

  it("leaves other fields intact", () => {
    const result = redactFields(sample, ["password"]);
    expect(result.userId).toBe("u-123");
  });

  it("ignores missing fields", () => {
    const result = redactFields(sample, ["token"]);
    expect(result).not.toHaveProperty("token");
  });
});

describe("pickFields", () => {
  it("returns only specified fields", () => {
    const result = pickFields(sample, ["level", "message"]);
    expect(Object.keys(result)).toEqual(["level", "message"]);
  });

  it("ignores missing fields", () => {
    const result = pickFields(sample, ["level", "nonexistent"]);
    expect(Object.keys(result)).toEqual(["level"]);
  });
});

describe("omitFields", () => {
  it("removes specified fields", () => {
    const result = omitFields(sample, ["password", "ip"]);
    expect(result).not.toHaveProperty("password");
    expect(result).not.toHaveProperty("ip");
    expect(result.level).toBe("info");
  });
});

describe("transformEntry", () => {
  it("applies all transformations in order", () => {
    const result = transformEntry(sample, {
      pick: ["level", "message", "userId", "password"],
      redact: ["password"],
      rename: { message: "msg" },
    });
    expect(result.msg).toBe("User logged in");
    expect(result.password).toBe("[REDACTED]");
    expect(result).not.toHaveProperty("ip");
  });

  it("returns entry unchanged with empty options", () => {
    const result = transformEntry(sample, {});
    expect(result).toEqual(sample);
  });
});

describe("transformEntries", () => {
  it("applies transform to all entries", () => {
    const entries = [sample, { ...sample, userId: "u-456" }];
    const results = transformEntries(entries, { redact: ["password"] });
    expect(results).toHaveLength(2);
    results.forEach((r) => expect(r.password).toBe("[REDACTED]"));
  });
});
