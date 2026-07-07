import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type {
  AngleCandidate,
  ReferenceAnalysis,
  ThumbnailConcept,
  TitleCandidate,
} from "@/lib/thumbnails/types";
import { ResultView } from "./ResultView";

export default async function ThumbnailIdeaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const idea = await prisma.thumbnailIdea.findUnique({
    where: { id },
    include: {
      sourceOutlier: { select: { title: true } },
      referenceOutliers: { select: { id: true, title: true } },
      scripts: { select: { id: true, chosenTitle: true, title: true, currentPhase: true } },
    },
  });

  if (!idea) notFound();

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-neutral-100">
        {idea.sourceOutlier?.title ?? idea.freeformIdea}
      </h1>
      <p className="mb-6 text-sm text-neutral-500">
        Generado el {idea.createdAt.toLocaleDateString("es-ES")}
        {idea.referenceOutliers.length > 0 &&
          ` · referencias: ${idea.referenceOutliers.map((r) => r.title).join(", ")}`}
      </p>

      <ResultView
        id={idea.id}
        status={idea.status}
        chosenAngle={idea.chosenAngle}
        angleCandidates={idea.angleCandidates as unknown as AngleCandidate[]}
        referenceAnalysis={idea.referenceAnalysis as unknown as ReferenceAnalysis[] | null}
        titleCandidates={idea.titleCandidates as unknown as TitleCandidate[]}
        chosenTitle={idea.chosenTitle}
        thumbnailConcept={idea.thumbnailConcept as unknown as ThumbnailConcept}
        imagePrompt={idea.imagePrompt}
        notes={idea.notes}
        scripts={idea.scripts}
      />
    </div>
  );
}
