import { del, put } from "@vercel/blob";

export interface UploadedViralThumbnail {
  url: string;
  pathname: string;
  contentType: string;
  size: number;
}

export async function uploadViralThumbnailBlob(
  filename: string,
  file: File
): Promise<UploadedViralThumbnail> {
  const result = await put(`viral-thumbnails/${filename}`, file, {
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

export async function deleteViralThumbnailBlob(pathname: string): Promise<void> {
  await del(pathname);
}
