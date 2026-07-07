"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { OutlineSection } from "@/lib/scripts/types";
import { runOutlineStage, runPayoffsStage, updateScript } from "./actions";

export function OutlineStage({
  id,
  outlineSections,
  brainDump,
  notes: initialNotes,
}: {
  id: string;
  outlineSections: OutlineSection[] | null;
  brainDump: string | null;
  notes: string | null;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [isRegenerating, startRegenerate] = useTransition();
  const [isSavingNotes, startSaveNotes] = useTransition();
  const [isAdvancing, startAdvance] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function regenerate() {
    setError(null);
    startRegenerate(async () => {
      try {
        await runOutlineStage(id, brainDump ?? "");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo regenerar el outline.");
      }
    });
  }

  function continueToPayoffs() {
    setError(null);
    startAdvance(async () => {
      try {
        await runPayoffsStage(id);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudieron generar los payoffs.");
      }
    });
  }

  function saveNotes() {
    startSaveNotes(async () => {
      await updateScript(id, { notes });
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-neutral-800 bg-neutral-950 p-4">
      <h2 className="text-sm font-medium text-neutral-300">Etapa 3 — Outline</h2>

      {outlineSections && (
        <ol className="flex flex-col gap-2">
          {outlineSections
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((s) => (
              <li
                key={s.order}
                className="rounded-md border border-neutral-800 bg-neutral-900 p-3 text-sm"
              >
                <p className="font-medium text-neutral-100">
                  {s.order}. {s.workingTitle}
                </p>
                <p className="mt-1 text-neutral-400">
                  <span className="text-neutral-300">Abre:</span> {s.openProblem}
                </p>
                <p className="mt-1 text-neutral-400">
                  <span className="text-neutral-300">Payoff:</span> {s.payoffPreview}
                </p>
                <p className="mt-1 text-xs text-neutral-600">{s.sourceNote}</p>
              </li>
            ))}
        </ol>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="button"
        onClick={regenerate}
        disabled={isRegenerating}
        className="self-start rounded-md border border-neutral-700 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-800 disabled:opacity-50"
      >
        {isRegenerating ? "Regenerando…" : "Regenerar outline"}
      </button>

      <div>
        <p className="mb-1 text-xs text-neutral-500">Notas</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100"
        />
        <button
          type="button"
          onClick={saveNotes}
          disabled={isSavingNotes}
          className="mt-2 rounded-md border border-neutral-700 px-3 py-2 text-xs text-neutral-200 hover:bg-neutral-800 disabled:opacity-50"
        >
          Guardar notas
        </button>
      </div>

      <button
        type="button"
        onClick={continueToPayoffs}
        disabled={isAdvancing || !outlineSections}
        className="self-start rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
      >
        {isAdvancing ? "Generando…" : "Continuar a Payoffs"}
      </button>
    </div>
  );
}
