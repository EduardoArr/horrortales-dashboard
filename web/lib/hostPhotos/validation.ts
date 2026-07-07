import { UserFacingError } from "../errors";
import { MAX_PHOTO_SIZE_BYTES } from "./config";

export interface UploadCandidate {
  type: string;
  size: number;
}

/** Pure validation so it's testable without mocking auth/Prisma/Blob —
 *  called by the uploadHostPhoto server action before any I/O happens. */
export function validatePhotoUpload(file: UploadCandidate, hostLabel: string): void {
  if (file.size === 0) {
    throw new UserFacingError("No se seleccionó ningún archivo.");
  }
  if (!file.type.startsWith("image/")) {
    throw new UserFacingError("El archivo debe ser una imagen.");
  }
  if (file.size > MAX_PHOTO_SIZE_BYTES) {
    throw new UserFacingError(
      `La imagen supera el tamaño máximo de ${MAX_PHOTO_SIZE_BYTES / (1024 * 1024)} MB.`
    );
  }
  if (!hostLabel.trim()) {
    throw new UserFacingError("Falta el nombre del presentador.");
  }
}
