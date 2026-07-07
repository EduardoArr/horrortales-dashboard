import { UserFacingError } from "../errors";
import { MAX_VIRAL_THUMBNAIL_SIZE_BYTES } from "./config";

export interface UploadCandidate {
  type: string;
  size: number;
}

/** Pure validation so it's testable without mocking auth/Prisma/Blob —
 *  called by the uploadViralThumbnail server action before any I/O happens. */
export function validateViralThumbnailUpload(file: UploadCandidate): void {
  if (file.size === 0) {
    throw new UserFacingError("No se seleccionó ningún archivo.");
  }
  if (!file.type.startsWith("image/")) {
    throw new UserFacingError("El archivo debe ser una imagen.");
  }
  if (file.size > MAX_VIRAL_THUMBNAIL_SIZE_BYTES) {
    throw new UserFacingError(
      `La imagen supera el tamaño máximo de ${MAX_VIRAL_THUMBNAIL_SIZE_BYTES / (1024 * 1024)} MB.`
    );
  }
}
