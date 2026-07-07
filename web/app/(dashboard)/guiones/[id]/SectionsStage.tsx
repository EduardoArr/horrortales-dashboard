"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { OutlineSection } from "@/lib/scripts/types";
import { chooseSectionVariation, generateSection, retrySectionStage, runTransitionsStage } from "./actions";

export interface SectionRow {
  order: number;
  variations: { text: string; wordCount: number }[] | null;
  chosenText: string | null;
  pendingClarification: { question: string; wantsTwoVariations: boolean } | null;
}

function SectionEditor({
  id,
  order,
  workingTitle,
  openProblem,
  payoffPreview,
  row,
}: {
  id: string;
  order: number;
  workingTitle: string;
  openProblem: string;
  payoffPreview: string;
  row: SectionRow;
}) {
  const router = useRouter();
  const [wantsTwoVariations, setWantsTwoVariations] = useState(false);
  const [answer, setAnswer] = useState("");
  const [chosenText, setChosenText] = useState(row.chosenText ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, startGenerate] = useTransition();
  const [isRetrying, startRetry] = useTransition();
  const [isSaving, startSave] = useTransition();

  function generate() {
    setError(null);
    startGenerate(async () => {
      try {
        await generateSection(id, order, wantsTwoVariations);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo generar la sección.");
      }
    });
  }

  function retry() {
    setError(null);
    if (!answer.trim()) {
      setError("Escribí una respuesta.");
      return;
    }
    startRetry(async () => {
      try {
        await retrySectionStage(id, order, answer);
        setAnswer("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo reintentar.");
      }
    });
  }

  function pick(text: string) {
    setChosenText(text);
  }

  function save() {
    setError(null);
    if (!chosenText.trim()) {
      setError("Elegí o escribí el texto de la sección.");
      return;
    }
    startSave(async () => {
      try {
        await chooseSectionVariation(id, order, chosenText);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo guardar la sección.");
      }
    });
  }

  return (
    <div className="rounded-md border border-red-900/50 bg-neutral-900 p-4">
      <p className="font-medium text-neutral-100">
        {order}. {workingTitle}
      </p>
      <p className="mt-1 text-xs text-neutral-500">
        <span className="text-neutral-400">Abre:</span> {openProblem}
      </p>
      <p className="mt-1 text-xs text-neutral-500">
        <span className="text-neutral-400">Payoff:</span> {payoffPreview}
      </p>

      {row.pendingClarification ? (
        <div className="mt-3 flex flex-col gap-2 rounded-md border border-yellow-900/50 bg-yellow-950/10 p-3">
          <p className="text-sm font-medium text-yellow-200">Falta un dato para continuar</p>
          <p className="text-sm text-neutral-200">{row.pendingClarification.question}</p>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={2}
            placeholder="Escribí el dato que falta..."
            className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600"
          />
          <button
            type="button"
            onClick={retry}
            disabled={isRetrying}
            className="self-start rounded-md bg-red-700 px-3 py-2 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50"
          >
            {isRetrying ? "Reintentando…" : "Reintentar"}
          </button>
        </div>
      ) : !row.variations ? (
        <div className="mt-3 flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-neutral-400">
            <input
              type="checkbox"
              checked={wantsTwoVariations}
              onChange={(e) => setWantsTwoVariations(e.target.checked)}
            />
            Quiero 2 variaciones
          </label>
          <button
            type="button"
            onClick={generate}
            disabled={isGenerating}
            className="rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
          >
            {isGenerating ? "Generando…" : "Generar sección"}
          </button>
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          <ul className="flex flex-col gap-2">
            {row.variations.map((v, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => pick(v.text)}
                  className={`w-full rounded-md border px-3 py-2 text-left text-sm whitespace-pre-wrap ${
                    chosenText === v.text
                      ? "border-red-800 bg-red-900/30 text-red-100"
                      : "border-neutral-800 bg-neutral-950 text-neutral-300 hover:bg-neutral-900"
                  }`}
                >
                  <p className="text-xs uppercase text-neutral-500">{v.wordCount} palabras</p>
                  <p className="mt-1">{v.text}</p>
                </button>
              </li>
            ))}
          </ul>

          <div>
            <p className="mb-1 text-xs text-neutral-500">Texto elegido (editable)</p>
            <textarea
              value={chosenText}
              onChange={(e) => setChosenText(e.target.value)}
              rows={6}
              className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={generate}
              disabled={isGenerating}
              className="rounded-md border border-neutral-700 px-3 py-2 text-xs text-neutral-200 hover:bg-neutral-800 disabled:opacity-50"
            >
              {isGenerating ? "Regenerando…" : "Regenerar"}
            </button>
            <button
              type="button"
              onClick={save}
              disabled={isSaving}
              className="rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
            >
              {isSaving ? "Guardando…" : "Guardar y continuar"}
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}

export function SectionsStage({
  id,
  outlineSections,
  sections,
}: {
  id: string;
  outlineSections: OutlineSection[] | null;
  sections: SectionRow[];
}) {
  const router = useRouter();
  const [isAdvancing, startAdvance] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const sorted = sections.slice().sort((a, b) => a.order - b.order);
  const activeIndex = sorted.findIndex((s) => !s.chosenText);
  const allConfirmed = activeIndex === -1;
  const titleByOrder = new Map((outlineSections ?? []).map((s) => [s.order, s]));

  function continueToTransitions() {
    setError(null);
    startAdvance(async () => {
      try {
        await runTransitionsStage(id);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudieron generar las transiciones.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-neutral-800 bg-neutral-950 p-4">
      <h2 className="text-sm font-medium text-neutral-300">Etapa 5 — Secciones completas</h2>

      <ol className="flex flex-col gap-3">
        {sorted.map((row, i) => {
          const outline = titleByOrder.get(row.order);
          if (!outline) return null;
          if (row.chosenText) {
            return (
              <li
                key={row.order}
                className="rounded-md border border-neutral-800 bg-neutral-900 p-3 text-sm"
              >
                <p className="font-medium text-neutral-100">
                  {row.order}. {outline.workingTitle}
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-neutral-500">{row.chosenText}</p>
              </li>
            );
          }
          if (i === activeIndex) {
            return (
              <SectionEditor
                key={row.order}
                id={id}
                order={row.order}
                workingTitle={outline.workingTitle}
                openProblem={outline.openProblem}
                payoffPreview={outline.payoffPreview}
                row={row}
              />
            );
          }
          return null;
        })}
      </ol>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="button"
        onClick={continueToTransitions}
        disabled={isAdvancing || !allConfirmed}
        className="self-start rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
      >
        {isAdvancing ? "Generando…" : "Continuar a Transiciones"}
      </button>
    </div>
  );
}
