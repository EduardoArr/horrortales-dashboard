"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { runStyleReviewStage } from "./actions";

export function StyleReviewStage({
  id,
  editedFinalScript: initialEditedFinalScript,
}: {
  id: string;
  editedFinalScript: string | null;
}) {
  const router = useRouter();
  const [editedFinalScript, setEditedFinalScript] = useState(initialEditedFinalScript ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, startAnalyze] = useTransition();

  function analyze() {
    setError(null);
    if (!editedFinalScript.trim()) {
      setError("Pegá la versión final editada del guion.");
      return;
    }
    startAnalyze(async () => {
      try {
        await runStyleReviewStage(id, editedFinalScript);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo analizar la edición final.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-neutral-800 bg-neutral-950 p-4">
      <h2 className="text-sm font-medium text-neutral-300">Etapa 8 — Feedback loop</h2>
      <p className="text-xs text-neutral-500">
        Pegá acá la versión final del guion tal como quedó después de tu edición manual. Se
        compara contra lo generado y se genera un reporte de guía de estilo para el próximo guion.
      </p>

      <textarea
        value={editedFinalScript}
        onChange={(e) => setEditedFinalScript(e.target.value)}
        rows={12}
        placeholder="Pegá acá la versión final editada del guion..."
        className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600"
      />

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="button"
        onClick={analyze}
        disabled={isAnalyzing}
        className="self-start rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
      >
        {isAnalyzing ? "Analizando…" : "Analizar cambios"}
      </button>
    </div>
  );
}
