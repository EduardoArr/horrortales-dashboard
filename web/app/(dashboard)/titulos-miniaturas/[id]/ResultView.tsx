"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { ScriptPhase, ThumbnailIdeaStatus } from "@prisma/client";
import type {
  AngleCandidate,
  ReferenceAnalysis,
  ThumbnailConcept,
  TitleCandidate,
} from "@/lib/thumbnails/types";
import { setThumbnailIdeaStatus, updateThumbnailIdea } from "./actions";

export interface ResultViewProps {
  id: string;
  status: ThumbnailIdeaStatus;
  chosenAngle: string;
  angleCandidates: AngleCandidate[];
  referenceAnalysis: ReferenceAnalysis[] | null;
  titleCandidates: TitleCandidate[];
  chosenTitle: string;
  thumbnailConcept: ThumbnailConcept;
  imagePrompt: string;
  notes: string | null;
  scripts: { id: string; chosenTitle: string | null; title: string | null; currentPhase: ScriptPhase }[];
}

export function ResultView({
  id,
  status,
  chosenAngle,
  angleCandidates,
  referenceAnalysis,
  titleCandidates,
  chosenTitle: initialChosenTitle,
  thumbnailConcept,
  imagePrompt: initialImagePrompt,
  notes: initialNotes,
  scripts,
}: ResultViewProps) {
  const [chosenTitle, setChosenTitle] = useState(initialChosenTitle);
  const [imagePrompt, setImagePrompt] = useState(initialImagePrompt);
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [copied, setCopied] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const sortedTitles = [...titleCandidates].sort((a, b) => a.ctrRank - b.ctrRank);

  function saveChanges() {
    setSaveMessage(null);
    startTransition(async () => {
      await updateThumbnailIdea(id, { chosenTitle, imagePrompt, notes });
      setSaveMessage("Guardado.");
    });
  }

  function toggleStatus() {
    const next: ThumbnailIdeaStatus = status === "FINAL" ? "DRAFT" : "FINAL";
    startTransition(async () => {
      await setThumbnailIdeaStatus(id, next);
    });
  }

  async function copyPrompt() {
    await navigator.clipboard.writeText(imagePrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div className="flex items-center gap-3">
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            status === "FINAL"
              ? "bg-green-900/60 text-green-200"
              : "bg-neutral-800 text-neutral-300"
          }`}
        >
          {status === "FINAL" ? "Final" : "Borrador"}
        </span>
        <button
          type="button"
          onClick={toggleStatus}
          disabled={isPending}
          className="rounded-md border border-neutral-700 px-3 py-1 text-xs text-neutral-200 hover:bg-neutral-800 disabled:opacity-50"
        >
          {status === "FINAL" ? "Volver a borrador" : "Marcar como final"}
        </button>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-medium text-neutral-300">Ángulo asesino</h2>
        <p className="rounded-lg border border-red-900/50 bg-red-950/20 p-3 text-sm text-neutral-100">
          {chosenAngle}
        </p>
        <details className="mt-2">
          <summary className="cursor-pointer text-xs text-neutral-500">
            Ver los 5 ángulos candidatos
          </summary>
          <ul className="mt-2 flex flex-col gap-2">
            {angleCandidates.map((a, i) => (
              <li
                key={i}
                className={`rounded-md border p-2 text-xs ${
                  a.recommended
                    ? "border-red-900/50 text-neutral-200"
                    : "border-neutral-800 text-neutral-400"
                }`}
              >
                <p className="font-medium">{a.angle}</p>
                <p className="mt-1 text-neutral-500">{a.whyItWorks}</p>
              </li>
            ))}
          </ul>
        </details>
      </section>

      {referenceAnalysis && referenceAnalysis.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-medium text-neutral-300">
            Análisis de referencias
          </h2>
          <ul className="flex flex-col gap-2">
            {referenceAnalysis.map((r) => (
              <li
                key={r.outlierId}
                className="rounded-md border border-neutral-800 bg-neutral-950 p-3 text-xs text-neutral-400"
              >
                <p>
                  <span className="text-neutral-300">Promesa:</span> {r.mainPromise}
                </p>
                <p>
                  <span className="text-neutral-300">Emoción:</span> {r.emotion}
                </p>
                <p>
                  <span className="text-neutral-300">Muestra:</span> {r.whatIsShown}
                </p>
                <p>
                  <span className="text-neutral-300">Oculta:</span> {r.whatIsHidden}
                </p>
                <p>
                  <span className="text-neutral-300">Patrón:</span> {r.repeatingPattern}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm font-medium text-neutral-300">Título</h2>
        <input
          value={chosenTitle}
          onChange={(e) => setChosenTitle(e.target.value)}
          className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100"
        />
        <details className="mt-2">
          <summary className="cursor-pointer text-xs text-neutral-500">
            Ver las 10 alternativas rankeadas
          </summary>
          <ul className="mt-2 flex flex-col gap-1">
            {sortedTitles.map((t) => (
              <li key={t.title}>
                <button
                  type="button"
                  onClick={() => setChosenTitle(t.title)}
                  className={`w-full rounded-md border px-3 py-2 text-left text-xs ${
                    t.isTopThree
                      ? "border-red-900/50 text-neutral-200"
                      : "border-neutral-800 text-neutral-400"
                  } hover:bg-neutral-900`}
                >
                  <span className="mr-2 text-neutral-600">#{t.ctrRank}</span>
                  {t.title}
                  <span className="ml-2 text-neutral-600">— {t.triggerNote}</span>
                </button>
              </li>
            ))}
          </ul>
        </details>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-neutral-300">Concepto de miniatura</h2>
        <div className="flex flex-col gap-2 rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-xs text-neutral-400">
          <p>
            <span className="text-neutral-300">Elemento visual principal:</span>{" "}
            {thumbnailConcept.mainVisualElement}
          </p>
          {thumbnailConcept.facialExpression && (
            <p>
              <span className="text-neutral-300">Expresión facial:</span>{" "}
              {thumbnailConcept.facialExpression}
            </p>
          )}
          <p>
            <span className="text-neutral-300">Contraste de color:</span>{" "}
            {thumbnailConcept.colorContrastNote}
          </p>
          <p>
            <span className="text-neutral-300">Qué oculta:</span>{" "}
            {thumbnailConcept.withheldInfo}
          </p>
          <p>
            <span className="text-neutral-300">Regla de complemento:</span>{" "}
            {thumbnailConcept.complementRuleNote}
          </p>
          <div>
            <span className="text-neutral-300">Opciones de texto corto:</span>
            <ul className="mt-1 flex flex-wrap gap-2">
              {thumbnailConcept.textOptions.map((t) => (
                <li
                  key={t}
                  className="rounded-full border border-neutral-700 px-2 py-0.5 text-neutral-300"
                >
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium text-neutral-300">
            Prompt de imagen (pegar en ChatGPT)
          </h2>
          <button
            type="button"
            onClick={copyPrompt}
            className="rounded-md border border-neutral-700 px-2 py-1 text-xs text-neutral-200 hover:bg-neutral-800"
          >
            {copied ? "Copiado" : "Copiar"}
          </button>
        </div>
        <textarea
          value={imagePrompt}
          onChange={(e) => setImagePrompt(e.target.value)}
          rows={6}
          className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs text-neutral-100"
        />
      </section>

      <section className="rounded-lg border border-yellow-900/40 bg-yellow-950/10 p-3 text-xs text-yellow-200/80">
        <p className="font-medium text-yellow-200">Antes de publicar: test de 5 personas</p>
        <p className="mt-1">
          Mostrale el título y la miniatura a 5 personas del público objetivo con una sola
          pregunta: &quot;¿harías clic?&quot;. Si la respuesta no es un sí entusiasta de al
          menos 4 de 5, volvé al ángulo (no al diseño).
        </p>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium text-neutral-300">Guion</h2>
          <Link
            href={`/guiones/nuevo?ideaId=${id}`}
            className="rounded-md bg-red-700 px-3 py-1 text-xs font-medium text-white transition hover:bg-red-600"
          >
            Crear guion con esta idea
          </Link>
        </div>
        {scripts.length > 0 && (
          <ul className="flex flex-col gap-2">
            {scripts.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/guiones/${s.id}`}
                  className="flex items-center justify-between rounded-md border border-neutral-800 bg-neutral-950 p-3 text-sm text-neutral-200 hover:bg-neutral-900"
                >
                  <span>{s.chosenTitle ?? s.title ?? "Guion sin título"}</span>
                  <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-400">
                    {s.currentPhase}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-neutral-300">Notas</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Ej. resultado del test de 5 personas"
          className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600"
        />
      </section>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={saveChanges}
          disabled={isPending}
          className="rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
        >
          Guardar cambios
        </button>
        {saveMessage && <span className="text-sm text-neutral-500">{saveMessage}</span>}
      </div>
    </div>
  );
}
