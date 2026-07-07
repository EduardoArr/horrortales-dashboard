import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type {
  CtaItem,
  IntroVariation,
  OutlineSection,
  PayoffItem,
  StyleGuideReport,
  TitleAssessment,
  TitleCandidate,
  TransitionHookSet,
} from "@/lib/scripts/types";
import { ScriptWizard } from "./ScriptWizard";

export default async function ScriptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const script = await prisma.script.findUnique({
    where: { id },
    include: {
      sourceThumbnailIdea: { select: { chosenTitle: true } },
      clarifications: { orderBy: { createdAt: "asc" } },
      sections: { orderBy: { order: "asc" } },
    },
  });

  if (!script) notFound();

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-neutral-100">
        {script.chosenTitle ?? script.title ?? "Guion sin título todavía"}
      </h1>
      <p className="mb-6 text-sm text-neutral-500">
        Creado el {script.createdAt.toLocaleDateString("es-ES")}
        {script.sourceThumbnailIdea?.chosenTitle &&
          ` · desde: ${script.sourceThumbnailIdea.chosenTitle}`}
      </p>

      <ScriptWizard
        id={script.id}
        currentPhase={script.currentPhase}
        pendingClarification={
          script.pendingClarification as unknown as {
            phase:
              | "TITLE"
              | "INTRO"
              | "OUTLINE"
              | "PAYOFFS"
              | "TRANSITIONS"
              | "CTAS"
              | "STYLE_REVIEW";
            question: string;
          } | null
        }
        research={script.research}
        referenceScript={script.referenceScript}
        thumbnailDescription={script.thumbnailDescription}
        titleMode={script.titleMode}
        title={script.title}
        titleAssessment={script.titleAssessment as unknown as TitleAssessment | null}
        titleCandidates={script.titleCandidates as unknown as TitleCandidate[] | null}
        chosenTitle={script.chosenTitle}
        introVariations={script.introVariations as unknown as IntroVariation[] | null}
        chosenIntroAngle={script.chosenIntroAngle}
        chosenIntro={script.chosenIntro}
        brainDump={script.brainDump}
        outlineSections={script.outlineSections as unknown as OutlineSection[] | null}
        payoffs={script.payoffs as unknown as PayoffItem[] | null}
        sections={script.sections.map((s) => ({
          order: s.order,
          variations: s.variations as unknown as { text: string; wordCount: number }[] | null,
          chosenText: s.chosenText,
          pendingClarification: s.pendingClarification as unknown as {
            question: string;
            wantsTwoVariations: boolean;
          } | null,
        }))}
        transitionHooks={script.transitionHooks as unknown as TransitionHookSet[] | null}
        ctas={script.ctas as unknown as CtaItem[] | null}
        editedFinalScript={script.editedFinalScript}
        styleGuideReport={script.styleGuideReport as unknown as StyleGuideReport | null}
        notes={script.notes}
        clarifications={script.clarifications.map((c) => ({
          id: c.id,
          phase: c.phase,
          question: c.question,
          answer: c.answer,
        }))}
      />
    </div>
  );
}
