"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { TitleAssessment, TitleCandidate } from "@/lib/scripts/types";
import { runIntroStage, updateScript } from "./actions";

export function TitleStage({
  id,
  titleMode,
  titleAssessment,
  titleCandidates,
  chosenTitle: initialChosenTitle,
  title,
}: {
  id: string;
  titleMode: "VALIDATE" | "GENERATE";
  titleAssessment: TitleAssessment | null;
  titleCandidates: TitleCandidate[] | null;
  chosenTitle: string | null;
  title: string | null;
}) {
  const router = useRouter();
  const [chosenTitle, setChosenTitle] = useState(initialChosenTitle ?? title ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSave] = useTransition();
  const [isAdvancing, startAdvance] = useTransition();

  function selectCandidate(candidateTitle: string) {
    setChosenTitle(candidateTitle);
    startSave(async () => {
      await updateScript(id, { chosenTitle: candidateTitle });
      router.refresh();
    });
  }

  function saveTitle() {
    startSave(async () => {
      await updateScript(id, { chosenTitle });
      router.refresh();
    });
  }

  function continueToIntro() {
    setError(null);
    startAdvance(async () => {
      try {
        await runIntroStage(id);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo generar la intro.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-neutral-800 bg-neutral-950 p-4">
      <h2 className="text-sm font-medium text-neutral-300">Etapa 1 — Título</h2>

      {titleMode === "VALIDATE" && titleAssessment && (
        <div
          className={`rounded-md border p-3 text-sm ${
            titleAssessment.alignmentVerdict === "aligned"
              ? "border-green-900/50 bg-green-950/20 text-green-100"
              : "border-yellow-900/50 bg-yellow-950/20 text-yellow-100"
          }`}
        >
          <p className="font-medium">
            {titleAssessment.alignmentVerdict === "aligned"
              ? "Ángulo alineado"
              : "Posible desajuste"}
          </p>
          <p className="mt-1 text-neutral-300">{titleAssessment.reasoning}</p>
          {titleAssessment.warning && (
            <p className="mt-1 text-yellow-200">{titleAssessment.warning}</p>
          )}
        </div>
      )}

      {titleMode === "GENERATE" && titleCandidates && (
        <ul className="flex flex-col gap-2">
          {titleCandidates.map((c) => (
            <li key={c.title}>
              <button
                type="button"
                onClick={() => selectCandidate(c.title)}
                className={`w-full rounded-md border px-3 py-2 text-left text-sm ${
                  chosenTitle === c.title
                    ? "border-red-800 bg-red-900/30 text-red-100"
                    : "border-neutral-800 bg-neutral-950 text-neutral-300 hover:bg-neutral-900"
                }`}
              >
                <p className="font-medium">{c.title}</p>
                <p className="mt-1 text-xs text-neutral-500">
                  {c.angle} — <span className="uppercase">{c.hook}</span>
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div>
        <p className="mb-1 text-xs text-neutral-500">Título elegido (editable)</p>
        <div className="flex gap-2">
          <input
            value={chosenTitle}
            onChange={(e) => setChosenTitle(e.target.value)}
            className="flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100"
          />
          <button
            type="button"
            onClick={saveTitle}
            disabled={isSaving}
            className="rounded-md border border-neutral-700 px-3 py-2 text-xs text-neutral-200 hover:bg-neutral-800 disabled:opacity-50"
          >
            Guardar
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="button"
        onClick={continueToIntro}
        disabled={isAdvancing || !chosenTitle.trim()}
        className="self-start rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
      >
        {isAdvancing ? "Generando…" : "Continuar a Intro"}
      </button>
    </div>
  );
}
