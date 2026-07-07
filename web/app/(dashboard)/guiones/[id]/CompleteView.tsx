import type { CtaItem, OutlineSection, StyleGuideReport, TransitionHookSet } from "@/lib/scripts/types";
import type { SectionRow } from "./SectionsStage";

const REPORT_LABEL: Record<keyof StyleGuideReport, string> = {
  structuralChanges: "Cambios estructurales",
  styleChanges: "Cambios de estilo",
  repeatedPatterns: "Patrones repetidos",
  factualCorrections: "Correcciones factuales",
};

export function CompleteView({
  chosenIntro,
  outlineSections,
  sections,
  transitionHooks,
  ctas,
  styleGuideReport,
}: {
  chosenIntro: string | null;
  outlineSections: OutlineSection[] | null;
  sections: SectionRow[];
  transitionHooks: TransitionHookSet[] | null;
  ctas: CtaItem[] | null;
  styleGuideReport: StyleGuideReport | null;
}) {
  const titleByOrder = new Map((outlineSections ?? []).map((s) => [s.order, s.workingTitle]));
  const sorted = sections.slice().sort((a, b) => a.order - b.order);
  const endCta = ctas?.find((c) => c.position === "end_screen");

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-green-900/50 bg-green-950/10 p-4">
        <p className="text-sm font-medium text-green-200">Guion completo</p>
        <p className="mt-1 text-xs text-neutral-500">
          Todas las etapas fueron aprobadas — este es el guion ensamblado de punta a punta.
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-lg border border-neutral-800 bg-neutral-950 p-4 text-sm text-neutral-200">
        <div>
          <p className="mb-1 text-xs uppercase text-neutral-500">Intro</p>
          <p className="whitespace-pre-wrap">{chosenIntro}</p>
        </div>

        {sorted.map((s) => {
          const cta = ctas?.find((c) => c.afterSectionOrder === s.order);
          const hook = transitionHooks?.find((h) => h.afterSectionOrder === s.order);
          return (
            <div key={s.order}>
              <p className="mb-1 text-xs uppercase text-neutral-500">
                Sección {s.order} — {titleByOrder.get(s.order) ?? ""}
              </p>
              <p className="whitespace-pre-wrap">{s.chosenText}</p>
              {cta && (
                <p className="mt-2 text-xs italic text-neutral-400">[CTA] {cta.text}</p>
              )}
              {hook?.chosenText && (
                <p className="mt-2 text-neutral-300">{hook.chosenText}</p>
              )}
            </div>
          );
        })}

        {endCta && (
          <div>
            <p className="mb-1 text-xs uppercase text-neutral-500">Cierre</p>
            <p className="italic text-neutral-400">[CTA] {endCta.text}</p>
          </div>
        )}
      </div>

      {styleGuideReport && (
        <div className="flex flex-col gap-4 rounded-lg border border-neutral-800 bg-neutral-950 p-4">
          <p className="text-sm font-medium text-neutral-300">
            Etapa 8 — Reporte de guía de estilo
          </p>
          {(Object.keys(REPORT_LABEL) as (keyof StyleGuideReport)[]).map((key) => (
            <div key={key}>
              <p className="mb-1 text-xs uppercase text-neutral-500">{REPORT_LABEL[key]}</p>
              {styleGuideReport[key].length === 0 ? (
                <p className="text-xs text-neutral-600">Sin cambios relevantes.</p>
              ) : (
                <ul className="flex list-disc flex-col gap-1 pl-4 text-sm text-neutral-300">
                  {styleGuideReport[key].map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
