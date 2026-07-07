import { del, put } from "@vercel/blob";

export interface UploadedPhoto {
  url: string;
  pathname: string;
  contentType: string;
  size: number;
}

/** Only module in the app that imports @vercel/blob — everything else goes
 *  through this thin wrapper so the storage provider stays swappable. */
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
