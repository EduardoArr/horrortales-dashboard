"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteViralThumbnailBlob, uploadViralThumbnailBlob } from "@/lib/viralThumbnails/blobClient";
import { validateViralThumbnailUpload } from "@/lib/viralThumbnails/validation";
import { UserFacingError, runOrGenericError } from "@/lib/errors";

export async function uploadViralThumbnail(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new UserFacingError("Not authenticated");
  }
  const userId = session.user.id;

  const file = formData.get("file");
  const label = formData.get("label");

  if (!(file instanceof File)) {
    throw new UserFacingError("No se seleccionó ningún archivo.");
  }
  validateViralThumbnailUpload(file);

  await runOrGenericError(async () => {
    const uploaded = await uploadViralThumbnailBlob(file.name, file);

    await prisma.viralThumbnail.create({
      data: {
        blobUrl: uploaded.url,
        blobPathname: uploaded.pathname,
        originalFilename: file.name,
        contentType: uploaded.contentType,
        sizeBytes: uploaded.size,
        label: typeof label === "string" && label.trim() ? label.trim() : null,
        uploadedById: userId,
      },
    });
  }, "No se pudo subir la miniatura. Probá de nuevo en un momento.");

  revalidatePath("/titulos-miniaturas/virales");
  revalidatePath("/titulos-miniaturas/nuevo");
}

export async function deleteViralThumbnail(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new UserFacingError("Not authenticated");
  }

  await runOrGenericError(async () => {
    const photo = await prisma.viralThumbnail.findUniqueOrThrow({ where: { id } });
    await deleteViralThumbnailBlob(photo.blobPathname);
    await prisma.viralThumbnail.delete({ where: { id } });
  }, "No se pudo borrar la miniatura. Probá de nuevo en un momento.");

  revalidatePath("/titulos-miniaturas/virales");
  revalidatePath("/titulos-miniaturas/nuevo");
}
