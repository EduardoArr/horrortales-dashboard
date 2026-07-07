import { prisma } from "@/lib/prisma";
import { NewScriptForm } from "./NewScriptForm";

export default async function NewScriptPage({
  searchParams,
}: {
  searchParams: Promise<{ ideaId?: string }>;
}) {
  const { ideaId } = await searchParams;

  const idea = ideaId
    ? await prisma.thumbnailIdea.findUnique({
        where: { id: ideaId },
        select: { id: true, chosenTitle: true, thumbnailConcept: true },
      })
    : null;

  const initialThumbnailIdea = idea
    ? {
        id: idea.id,
        chosenTitle: idea.chosenTitle,
        thumbnailConcept: idea.thumbnailConcept as unknown as {
          mainVisualElement: string;
          withheldInfo: string;
        },
      }
    : null;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-neutral-100">Nuevo guion</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Cargá la investigación del caso para empezar. La IA nunca va a inventar un dato que no
        esté acá — si falta algo, te lo va a preguntar antes de seguir.
      </p>

      <NewScriptForm initialThumbnailIdea={initialThumbnailIdea} />
    </div>
  );
}
