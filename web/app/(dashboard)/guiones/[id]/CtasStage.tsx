"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CtaItem } from "@/lib/scripts/types";
import { advanceToStyleReview, runCtasStage, updateCtaText } from "./actions";

const POSITION_LABEL: Record<CtaItem["position"], string> = {
  post_first_section: "Después de la primera sección",
  mid_script: "A mitad del guion",
  end_screen: "Cierre (end screen)",
};

function CtaCard({ id, cta }: { id: string; cta: CtaItem }) {
  const router = useRouter();
  const [text, setText] = useState(cta.text);
  const [isSaving, startSave] = useTransition();

  function save() {
    startSave(async () => {
      await updateCtaText(id, cta.position, text);
      router.refresh();
    });
  }

  return (
    <li className="rounded-md border border-neutral-800 bg-neutral-900 p-3 text-sm">
      <p className="text-xs uppercase text-neutral-500">
        {POSITION_LABEL[cta.position]}
        {cta.afterSectionOrder !== null && ` · después de la sección ${cta.afterSectionOrder}`}
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        className="mt-2 w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100"
      />
      <button
        type="button"
        onClick={save}
        disabled={isSaving}
        className="mt-2 rounded-md border border-neutral-700 px-3 py-2 text-xs text-neutral-200 hover:bg-neutral-800 disabled:opacity-50"
      >
        {isSaving ? "Guardando…" : "Guardar"}
      </button>
    </li>
  );
}

export function CtasStage({ id, ctas }: { id: string; ctas: CtaItem[] | null }) {
  const router = useRouter();
  const [isRegenerating, startRegenerate] = useTransition();
  const [isAdvancing, startAdvance] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function regenerate() {
    setError(null);
    startRegenerate(async () => {
      try {
        await runCtasStage(id);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudieron regenerar los CTAs.");
      }
    });
  }

  function continueToStyleReview() {
    setError(null);
    startAdvance(async () => {
      try {
        await advanceToStyleReview(id);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo continuar a feedback loop.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-neutral-800 bg-neutral-950 p-4">
      <h2 className="text-sm font-medium text-neutral-300">Etapa 7 — CTAs</h2>

      {ctas && (
        <ul className="flex flex-col gap-3">
          {ctas.map((cta) => (
            <CtaCard key={cta.position} id={id} cta={cta} />
          ))}
        </ul>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={regenerate}
          disabled={isRegenerating}
          className="rounded-md border border-neutral-700 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-800 disabled:opacity-50"
        >
          {isRegenerating ? "Regenerando…" : "Regenerar"}
        </button>
        <button
          type="button"
          onClick={continueToStyleReview}
          disabled={isAdvancing || !ctas}
          className="rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
        >
          {isAdvancing ? "Avanzando…" : "Continuar a Feedback loop"}
        </button>
      </div>
    </div>
  );
}
