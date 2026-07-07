"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateTitleStage } from "@/lib/scripts/anthropicClient";
import { UserFacingError, runOrGenericError } from "@/lib/errors";
import type { Prisma } from "@prisma/client";

export interface CreateScriptInput {
  sourceThumbnailIdeaId: string | null;
  title: string | null;
  thumbnailDescription: string;
  research: string;
  referenceScript: string | null;
}

function synthesizeThumbnailDescription(concept: unknown): string {
  const c = concept as { mainVisualElement?: string; withheldInfo?: string };
  return [c.mainVisualElement, c.withheldInfo].filter(Boolean).join(" — ");
}

export async function createScript(input: CreateScriptInput) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new UserFacingError("Not authenticated");
  }
  const userId = session.user.id;

  const research = input.research.trim();
  if (!research) {
    throw new UserFacingError("Falta la investigación del caso");
  }

  return runOrGenericError(async () => {
    let title = input.title?.trim() || null;
    let thumbnailDescription = input.thumbnailDescription.trim();

    if (input.sourceThumbnailIdeaId) {
      const idea = await prisma.thumbnailIdea.findUniqueOrThrow({
        where: { id: input.sourceThumbnailIdeaId },
      });
      title = idea.chosenTitle;
      thumbnailDescription = synthesizeThumbnailDescription(idea.thumbnailConcept);
    }

    if (!thumbnailDescription) {
      throw new UserFacingError("Falta la descripción de la miniatura");
    }

    const titleMode = title ? ("VALIDATE" as const) : ("GENERATE" as const);
    const referenceScript = input.referenceScript?.trim() || null;

    const output = await generateTitleStage({
      mode: titleMode,
      title,
      thumbnailDescription,
      research,
      referenceScript,
      clarifications: [],
    });

    const baseData = {
      sourceThumbnailIdeaId: input.sourceThumbnailIdeaId,
      title,
      thumbnailDescription,
      research,
      referenceScript,
      titleMode,
      createdById: userId,
    };

    const created =
      output.status === "needs_input"
        ? await prisma.script.create({
            data: {
              ...baseData,
              pendingClarification: {
                phase: "TITLE",
                question: output.question,
              } as unknown as Prisma.InputJsonValue,
            },
          })
        : output.mode === "validate"
          ? await prisma.script.create({
              data: {
                ...baseData,
                titleAssessment: output.assessment as unknown as Prisma.InputJsonValue,
                chosenTitle: title,
              },
            })
          : await prisma.script.create({
              data: {
                ...baseData,
                titleCandidates: output.candidates as unknown as Prisma.InputJsonValue,
              },
            });

    revalidatePath("/guiones");
    return { id: created.id };
  }, "No se pudo crear el guion. Probá de nuevo en un momento.");
}
