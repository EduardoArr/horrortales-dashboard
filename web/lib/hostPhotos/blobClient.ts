import { del, put } from "@vercel/blob";

export interface UploadedPhoto {
  url: string;
  pathname: string;
  contentType: string;
  size: number;
}

/** Thin wrapper around @vercel/blob so the storage provider stays swappable —
 *  see lib/viralThumbnails/blobClient.ts for the equivalent for viral-thumbnail
 *  reference uploads. */
export async function uploadHostPhotoBlob(
  filename: string,
  file: File
): Promise<UploadedPhoto> {
  const result = await put(`host-photos/${filename}`, file, {
    access: "public",
    addRandomSuffix: true,
    contentType: file.type || "application/octet-stream",
  });
  return {
    url: result.url,
    pathname: result.pathname,
    contentType: result.contentType,
    size: file.size,
  };
}

export async function deleteHostPhotoBlob(pathname: string): Promise<void> {
  await del(pathname);
}
