"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ThumbnailIdeaStatus } from "@prisma/client";

export interface UpdateThumbnailIdeaPatch {
  chosenTitle?: string;
  imagePrompt?: string;
  notes?: string;
}

export async function updateThumbnailIdea(id: string, patch: UpdateThumbnailIdeaPatch) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  await prisma.thumbnailIdea.update({ where: { id }, data: patch });
  revalidatePath(`/titulos-miniaturas/${id}`);
}

export async function setThumbnailIdeaStatus(id: string, status: ThumbnailIdeaStatus) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  await prisma.thumbnailIdea.update({ where: { id }, data: { status } });
  revalidatePath(`/titulos-miniaturas/${id}`);
  revalidatePath("/titulos-miniaturas");
}

export async function deleteThumbnailIdea(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const idea = await prisma.thumbnailIdea.findUniqueOrThrow({ where: { id } });
  if (idea.status !== "DRAFT") {
    throw new Error("Solo se pueden eliminar borradores, no ideas marcadas como finales");
  }

  await prisma.thumbnailIdea.delete({ where: { id } });
  revalidatePath("/titulos-miniaturas");
}
