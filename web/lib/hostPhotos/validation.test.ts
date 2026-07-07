import { describe, expect, it } from "vitest";
import { validatePhotoUpload } from "./validation";
import { MAX_PHOTO_SIZE_BYTES } from "./config";
import { UserFacingError } from "../errors";

describe("validatePhotoUpload", () => {
  it("accepts a normal image", () => {
    expect(() =>
      validatePhotoUpload({ type: "image/png", size: 1024 }, "Host 1")
    ).not.toThrow();
  });

  it("rejects an empty file", () => {
    expect(() => validatePhotoUpload({ type: "image/png", size: 0 }, "Host 1")).toThrow(
      UserFacingError
    );
  });

  it("rejects a non-image content type", () => {
    expect(() =>
      validatePhotoUpload({ type: "application/pdf", size: 1024 }, "Host 1")
    ).toThrow(/imagen/);
  });

  it("rejects a file over the size limit", () => {
    expect(() =>
      validatePhotoUpload(
        { type: "image/png", size: MAX_PHOTO_SIZE_BYTES + 1 },
        "Host 1"
      )
    ).toThrow(/tamaño máximo/);
  });

  it("accepts a file exactly at the size limit", () => {
    expect(() =>
      validatePhotoUpload({ type: "image/png", size: MAX_PHOTO_SIZE_BYTES }, "Host 1")
    ).not.toThrow();
  });

  it("rejects a missing host label", () => {
    expect(() =>
      validatePhotoUpload({ type: "image/png", size: 1024 }, "   ")
    ).toThrow(/presentador/);
  });
});
