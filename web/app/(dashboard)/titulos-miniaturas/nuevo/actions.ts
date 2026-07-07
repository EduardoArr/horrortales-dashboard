"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateThumbnailIdea } from "@/lib/thumbnails/anthropicClient";
import { MAX_REFERENCES } from "@/lib/thumbnails/config";
import { UserFacingError, runOrGenericError } from "@/lib/errors";
import type { BuildPromptInput } from "@/lib/thumbnails/types";
import type { HostFeaturePreference, Prisma } from "@prisma/client";

export interface ReferenceSearchResult {
  id: string;
  title: string;
  thumbnailUrl: string | null;
}

export async function searchReferenceOutliers(
  query: string
): Promise<ReferenceSearchResult[]> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new UserFacingError("Not authenticated");
  }
  const trimmed = query.trim();
  if (!trimmed) return [];

  return prisma.outlier.findMany({
    where: { title: { contains: trimmed, mode: "insensitive" } },
    select: { id: true, title: true, thumbnailUrl: true },
    orderBy: { score: "desc" },
    take: 8,
  });
}

export interface CreateThumbnailIdeaInput {
  outlierId: string | null;
  freeformIdea: string | null;
  requestedHostFeature: HostFeaturePreference;
  referenceOutlierIds: string[];
  referenceViralThumbnailIds: string[];
}

export async function createThumbnailIdea(input: CreateThumbnailIdeaInput) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new UserFacingError("Not authenticated");
  }
  const userId = session.user.id;

  const freeformIdea = input.freeformIdea?.trim() || null;
  if (!input.outlierId && !freeformIdea) {
    throw new UserFacingError("Falta la idea de video");
  }
  const totalReferences = input.referenceOutlierIds.length + input.referenceViralThumbnailIds.length;
  if (totalReferences > MAX_REFERENCES) {
    throw new UserFacingError(`Máximo ${MAX_REFERENCES} referencias`);
  }

  return runOrGenericError(async () => {
    let ideaSource: BuildPromptInput["ideaSource"];
    if (input.outlierId) {
      const outlier = await prisma.outlier.findUniqueOrThrow({
        where: { id: input.outlierId },
      });
      ideaSource = {
        type: "outlier",
        outlierId: outlier.id,
        title: outlier.title,
        description: outlier.description,
      };
    } else {
      ideaSource = { type: "freeform", text: freeformIdea as string };
    }

    const outlierReferences = input.referenceOutlierIds.length
      ? await prisma.outlier.findMany({
          where: { id: { in: input.referenceOutlierIds } },
          select: { id: true, title: true, thumbnailUrl: true },
        })
      : [];

    const viralReferences = input.referenceViralThumbnailIds.length
      ? await prisma.viralThumbnail.findMany({
          where: { id: { in: input.referenceViralThumbnailIds } },
          select: { id: true, label: true, blobUrl: true },
        })
      : [];

    const output = await generateThumbnailIdea({
      ideaSource,
      requestedHostFeature: input.requestedHostFeature,
      references: [
        ...outlierReferences.map(
          (r): BuildPromptInput["references"][number] => ({
            source: "outlier",
            id: r.id,
            title: r.title,
            thumbnailUrl: r.thumbnailUrl,
          })
        ),
        ...viralReferences.map(
          (r): BuildPromptInput["references"][number] => ({
            source: "viral",
            id: r.id,
            label: r.label,
            thumbnailUrl: r.blobUrl,
          })
        ),
      ],
    });

    const created = await prisma.thumbnailIdea.create({
      data: {
        sourceOutlierId: input.outlierId,
        freeformIdea: input.outlierId ? null : freeformIdea,
        requestedHostFeature: input.requestedHostFeature,
        referenceOutliers: { connect: outlierReferences.map((r) => ({ id: r.id })) },
        viralReferences: { connect: viralReferences.map((r) => ({ id: r.id })) },
        angleCandidates: output.angleCandidates as unknown as Prisma.InputJsonValue,
        chosenAngle: output.chosenAngle,
        referenceAnalysis:
          (output.referenceAnalysis as unknown as Prisma.InputJsonValue) ?? undefined,
        titleCandidates: output.titleCandidates as unknown as Prisma.InputJsonValue,
        chosenTitle: output.chosenTitle,
        thumbnailConcept: output.thumbnailConcept as unknown as Prisma.InputJsonValue,
        imagePrompt: output.imagePrompt,
        createdById: userId,
      },
    });

    revalidatePath("/titulos-miniaturas");
    return { id: created.id };
  }, "No se pudo generar el título y miniatura. Probá de nuevo en un momento.");
}
