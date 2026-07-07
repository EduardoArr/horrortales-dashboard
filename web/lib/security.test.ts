import { describe, expect, it } from "vitest";
import { timingSafeStringEqual } from "./security";

describe("timingSafeStringEqual", () => {
  it("returns true for identical strings", () => {
    expect(timingSafeStringEqual("Bearer abc123", "Bearer abc123")).toBe(true);
  });

  it("returns false for different strings of the same length", () => {
    expect(timingSafeStringEqual("Bearer abc123", "Bearer abc124")).toBe(false);
  });

  it("returns false for strings of different lengths", () => {
    expect(timingSafeStringEqual("short", "a much longer string")).toBe(false);
  });

  it("returns false when one string is empty", () => {
    expect(timingSafeStringEqual("", "nonempty")).toBe(false);
  });

  it("returns true for two empty strings", () => {
    expect(timingSafeStringEqual("", "")).toBe(true);
  });
});
