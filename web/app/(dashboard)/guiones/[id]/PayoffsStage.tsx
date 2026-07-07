"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { OutlineSection, PayoffItem } from "@/lib/scripts/types";
import { runPayoffsStage, startSectionsStage } from "./actions";

export function PayoffsStage({
  id,
  outlineSections,
  payoffs,
}: {
  id: string;
  outlineSections: OutlineSection[] | null;
  payoffs: PayoffItem[] | null;
}) {
  const router = useRouter();
  const [isRegenerating, startRegenerate] = useTransition();
  const [isAdvancing, startAdvance] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function regenerate() {
    setError(null);
    startRegenerate(async () => {
      try {
        await runPayoffsStage(id);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudieron regenerar los payoffs.");
      }
    });
  }

  function continueToSections() {
    setError(null);
    startAdvance(async () => {
      try {
        await startSectionsStage(id);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo arrancar la etapa de secciones.");
      }
    });
  }

  const titleByOrder = new Map((outlineSections ?? []).map((s) => [s.order, s.workingTitle]));

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-neutral-800 bg-neutral-950 p-4">
      <h2 className="text-sm font-medium text-neutral-300">Etapa 4 — Payoffs</h2>

      {payoffs && (
        <ol className="flex flex-col gap-2">
          {payoffs
            .slice()
            .sort((a, b) => a.sectionOrder - b.sectionOrder)
            .map((p) => (
              <li
                key={p.sectionOrder}
                className="rounded-md border border-neutral-800 bg-neutral-900 p-3 text-sm"
              >
                <p className="font-medium text-neutral-100">
                  {p.sectionOrder}. {titleByOrder.get(p.sectionOrder) ?? ""}
                </p>
                <p className="mt-1 text-neutral-400">
                  <span className="text-neutral-300">Pregunta:</span> {p.question}
                </p>
                <p className="mt-1 text-neutral-400">
                  <span className="text-neutral-300">Payoff:</span> {p.payoff}
                </p>
                <p className="mt-1 text-xs text-neutral-600">{p.sourceNote}</p>
              </li>
            ))}
        </ol>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={regenerate}
          disabled={isRegenerating}
          className="rounded-md border border-neutral-700 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-800 disabled:opacity-50"
        >
          {isRegenerating ? "Regenerando…" : "Regenerar payoffs"}
        </button>
        <button
          type="button"
          onClick={continueToSections}
          disabled={isAdvancing || !payoffs}
          className="rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
        >
          {isAdvancing ? "Arrancando…" : "Continuar a Secciones"}
        </button>
      </div>
    </div>
  );
}
