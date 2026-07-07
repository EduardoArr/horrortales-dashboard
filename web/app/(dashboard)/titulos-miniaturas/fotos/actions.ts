"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteHostPhotoBlob, uploadHostPhotoBlob } from "@/lib/hostPhotos/blobClient";
import { validatePhotoUpload } from "@/lib/hostPhotos/validation";
import { UserFacingError, runOrGenericError } from "@/lib/errors";

export async function uploadHostPhoto(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new UserFacingError("Not authenticated");
  }
  const userId = session.user.id;

  const file = formData.get("file");
  const hostLabel = formData.get("hostLabel");
  const notes = formData.get("notes");

  if (!(file instanceof File)) {
    throw new UserFacingError("No se seleccionó ningún archivo.");
  }
  if (typeof hostLabel !== "string") {
    throw new UserFacingError("Falta el nombre del presentador.");
  }
  validatePhotoUpload(file, hostLabel);

  await runOrGenericError(async () => {
    const uploaded = await uploadHostPhotoBlob(file.name, file);

    await prisma.hostPhoto.create({
      data: {
        hostLabel: hostLabel.trim(),
        blobUrl: uploaded.url,
        blobPathname: uploaded.pathname,
        originalFilename: file.name,
        contentType: uploaded.contentType,
        sizeBytes: uploaded.size,
        notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
        uploadedById: userId,
      },
    });
  }, "No se pudo subir la foto. Probá de nuevo en un momento.");

  revalidatePath("/titulos-miniaturas/fotos");
}

export async function deleteHostPhoto(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new UserFacingError("Not authenticated");
  }

  await runOrGenericError(async () => {
    const photo = await prisma.hostPhoto.findUniqueOrThrow({ where: { id } });
    await deleteHostPhotoBlob(photo.blobPathname);
    await prisma.hostPhoto.delete({ where: { id } });
  }, "No se pudo borrar la foto. Probá de nuevo en un momento.");

  revalidatePath("/titulos-miniaturas/fotos");
}
