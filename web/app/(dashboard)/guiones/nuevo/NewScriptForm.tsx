"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createScript } from "./actions";

export interface InitialThumbnailIdea {
  id: string;
  chosenTitle: string;
  thumbnailConcept: { mainVisualElement: string; withheldInfo: string };
}

export function NewScriptForm({
  initialThumbnailIdea,
}: {
  initialThumbnailIdea: InitialThumbnailIdea | null;
}) {
  const router = useRouter();
  const [hasTitle, setHasTitle] = useState(false);
  const [title, setTitle] = useState("");
  const [thumbnailDescription, setThumbnailDescription] = useState("");
  const [research, setResearch] = useState("");
  const [hasReference, setHasReference] = useState(false);
  const [referenceScript, setReferenceScript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, startSubmit] = useTransition();

  function submit() {
    setError(null);
    if (!research.trim()) {
      setError("Pegá la investigación completa del caso.");
      return;
    }
    if (!initialThumbnailIdea && !thumbnailDescription.trim()) {
      setError("Describí la miniatura (la promesa psicológica del video).");
      return;
    }
    startSubmit(async () => {
      try {
        const result = await createScript({
          sourceThumbnailIdeaId: initialThumbnailIdea?.id ?? null,
          title: initialThumbnailIdea ? null : hasTitle ? title : null,
          thumbnailDescription: initialThumbnailIdea ? "" : thumbnailDescription,
          research,
          referenceScript: hasReference ? referenceScript : null,
        });
        router.push(`/guiones/${result.id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo falló creando el guion.");
      }
    });
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h2 className="mb-2 text-sm font-medium text-neutral-300">Título y miniatura (0.3)</h2>
        {initialThumbnailIdea ? (
          <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-4">
            <p className="text-sm font-medium text-neutral-100">
              {initialThumbnailIdea.chosenTitle}
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              {initialThumbnailIdea.thumbnailConcept.mainVisualElement}
              {initialThumbnailIdea.thumbnailConcept.withheldInfo &&
                ` — ${initialThumbnailIdea.thumbnailConcept.withheldInfo}`}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex gap-4 text-sm text-neutral-300">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={!hasTitle}
                  onChange={() => setHasTitle(false)}
                />
                Todavía no tengo título
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" checked={hasTitle} onChange={() => setHasTitle(true)} />
                Ya tengo título
              </label>
            </div>
            {hasTitle && (
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título elegido"
                className="w-full rounded-md border border-neutral-800 bg-neutral-950 p-3 text-sm text-neutral-100 placeholder:text-neutral-600"
              />
            )}
            <textarea
              value={thumbnailDescription}
              onChange={(e) => setThumbnailDescription(e.target.value)}
              rows={3}
              placeholder="Descripción de la miniatura: qué imagen, qué texto, qué expresión..."
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-sm text-neutral-100 placeholder:text-neutral-600"
            />
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-neutral-300">
          Investigación del caso (0.1)
        </h2>
        <textarea
          value={research}
          onChange={(e) => setResearch(e.target.value)}
          rows={10}
          placeholder="Pegá la investigación completa: hechos, fechas, nombres, cronología, declaraciones, fuentes..."
          className="w-full rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-sm text-neutral-100 placeholder:text-neutral-600"
        />
        <p className="mt-1 text-xs text-neutral-500">
          Única fuente de verdad para todo lo que se escriba después. Si falta un dato, la IA lo va
          a preguntar en vez de inventarlo.
        </p>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-neutral-300">
          Guion de referencia de la competencia (0.2)
        </h2>
        <div className="mb-2 flex gap-4 text-sm text-neutral-300">
          <label className="flex items-center gap-2">
            <input type="radio" checked={!hasReference} onChange={() => setHasReference(false)} />
            Avanzar sin referencia
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" checked={hasReference} onChange={() => setHasReference(true)} />
            Tengo un guion de referencia
          </label>
        </div>
        {hasReference && (
          <textarea
            value={referenceScript}
            onChange={(e) => setReferenceScript(e.target.value)}
            rows={6}
            placeholder="Pegá el guion de otro canal sobre el mismo caso o uno similar que haya funcionado bien..."
            className="w-full rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-sm text-neutral-100 placeholder:text-neutral-600"
          />
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={isSubmitting}
        className="self-start rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
      >
        {isSubmitting ? "Creando…" : "Crear guion"}
      </button>
    </div>
  );
}
