"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { HostFeaturePreference } from "@prisma/client";
import {
  createThumbnailIdea,
  searchReferenceOutliers,
  type ReferenceSearchResult,
} from "./actions";
import { updateOutlierStatus } from "../../outliers/actions";
import { MAX_REFERENCES } from "@/lib/thumbnails/config";

export interface InitialOutlier {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
}

export interface SavedOutlierOption {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  views: number;
  score: number;
  channelTitle: string;
}

const HOST_FEATURE_LABEL: Record<HostFeaturePreference, string> = {
  NONE: "Ninguno",
  HOST_1: "Host 1",
  HOST_2: "Host 2",
  BOTH: "Ambos",
};

function formatViews(n: number): string {
  return new Intl.NumberFormat("es-ES").format(n);
}

export function NewIdeaForm({
  initialOutlier,
  savedOutliers,
}: {
  initialOutlier: InitialOutlier | null;
  savedOutliers: SavedOutlierOption[];
}) {
  const router = useRouter();
  const [pickedOutlier, setPickedOutlier] = useState<InitialOutlier | null>(initialOutlier);
  const [savedList, setSavedList] = useState<SavedOutlierOption[]>(savedOutliers);
  const [freeformIdea, setFreeformIdea] = useState("");
  const [hostFeature, setHostFeature] = useState<HostFeaturePreference>("NONE");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ReferenceSearchResult[]>([]);
  const [selected, setSelected] = useState<ReferenceSearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, startSearch] = useTransition();
  const [isSubmitting, startSubmit] = useTransition();
  const [isDismissing, startDismiss] = useTransition();

  function pickSavedOutlier(o: SavedOutlierOption) {
    setPickedOutlier({
      id: o.id,
      title: o.title,
      description: o.description,
      thumbnailUrl: o.thumbnailUrl,
    });
  }

  function dismissSavedOutlier(id: string) {
    startDismiss(async () => {
      await updateOutlierStatus(id, "DISCARDED");
      setSavedList((prev) => prev.filter((o) => o.id !== id));
    });
  }

  function runSearch() {
    setError(null);
    startSearch(async () => {
      const found = await searchReferenceOutliers(query);
      setResults(found);
    });
  }

  function toggleReference(ref: ReferenceSearchResult) {
    setSelected((prev) => {
      const already = prev.some((r) => r.id === ref.id);
      if (already) return prev.filter((r) => r.id !== ref.id);
      if (prev.length >= MAX_REFERENCES) return prev;
      return [...prev, ref];
    });
  }

  function submit() {
    setError(null);
    if (!pickedOutlier && !freeformIdea.trim()) {
      setError("Escribí la idea de video.");
      return;
    }
    startSubmit(async () => {
      try {
        const result = await createThumbnailIdea({
          outlierId: pickedOutlier?.id ?? null,
          freeformIdea: pickedOutlier ? null : freeformIdea,
          requestedHostFeature: hostFeature,
          referenceOutlierIds: selected.map((r) => r.id),
        });
        router.push(`/titulos-miniaturas/${result.id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo falló generando la idea.");
      }
    });
  }

  const busy = isSubmitting;

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h2 className="mb-2 text-sm font-medium text-neutral-300">Idea de video</h2>
        {pickedOutlier ? (
          <div className="flex items-start justify-between gap-4 rounded-lg border border-neutral-800 bg-neutral-950 p-4">
            <div>
              <p className="text-sm font-medium text-neutral-100">{pickedOutlier.title}</p>
              {pickedOutlier.description && (
                <p className="mt-1 text-xs text-neutral-500">{pickedOutlier.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setPickedOutlier(null)}
              className="shrink-0 rounded-md border border-neutral-700 px-2 py-1 text-xs text-neutral-300 hover:bg-neutral-800"
            >
              Cambiar
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {savedList.length > 0 && (
              <div>
                <p className="mb-2 text-xs text-neutral-500">
                  Elegí un video guardado en outliers, o escribí una idea abajo.
                </p>
                <div className="overflow-x-auto rounded-lg border border-neutral-800">
                  <table className="w-full min-w-[600px] border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-neutral-800 text-left text-neutral-400">
                        <th className="p-2 font-medium">Vídeo</th>
                        <th className="p-2 font-medium">Canal</th>
                        <th className="p-2 font-medium">Vistas</th>
                        <th className="p-2 font-medium">Score</th>
                        <th className="p-2 font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {savedList.map((o) => (
                        <tr key={o.id} className="border-b border-neutral-900">
                          <td className="max-w-xs p-2">
                            <p className="font-medium text-neutral-100">{o.title}</p>
                          </td>
                          <td className="p-2 text-neutral-400">{o.channelTitle}</td>
                          <td className="p-2 text-neutral-400">{formatViews(o.views)}</td>
                          <td className="p-2 text-neutral-400">{o.score.toFixed(1)}x</td>
                          <td className="p-2">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => pickSavedOutlier(o)}
                                className="rounded-md border border-red-800 px-2 py-1 text-xs text-red-200 hover:bg-red-900/30"
                              >
                                Elegir
                              </button>
                              <button
                                type="button"
                                disabled={isDismissing}
                                onClick={() => dismissSavedOutlier(o.id)}
                                className="rounded-md border border-neutral-700 px-2 py-1 text-xs text-neutral-300 hover:bg-neutral-800 disabled:opacity-50"
                              >
                                Quitar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            <textarea
              value={freeformIdea}
              onChange={(e) => setFreeformIdea(e.target.value)}
              rows={4}
              placeholder="O describí una idea desde cero: el caso, qué la hace interesante..."
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-sm text-neutral-100 placeholder:text-neutral-600"
            />
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-neutral-300">
          Presentadores en la miniatura
        </h2>
        <select
          value={hostFeature}
          onChange={(e) => setHostFeature(e.target.value as HostFeaturePreference)}
          className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100"
        >
          {(Object.keys(HOST_FEATURE_LABEL) as HostFeaturePreference[]).map((key) => (
            <option key={key} value={key}>
              {HOST_FEATURE_LABEL[key]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-neutral-300">
          Referencias (opcional, hasta {MAX_REFERENCES})
        </h2>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), runSearch())}
            placeholder="Buscar por título en outliers guardados..."
            className="flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600"
          />
          <button
            type="button"
            onClick={runSearch}
            disabled={isSearching || !query.trim()}
            className="rounded-md border border-neutral-700 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-800 disabled:opacity-50"
          >
            {isSearching ? "Buscando…" : "Buscar"}
          </button>
        </div>

        {results.length > 0 && (
          <ul className="mt-2 flex flex-col gap-1">
            {results.map((r) => {
              const isSelected = selected.some((s) => s.id === r.id);
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => toggleReference(r)}
                    disabled={!isSelected && selected.length >= MAX_REFERENCES}
                    className={`w-full rounded-md border px-3 py-2 text-left text-sm disabled:opacity-40 ${
                      isSelected
                        ? "border-red-800 bg-red-900/30 text-red-100"
                        : "border-neutral-800 bg-neutral-950 text-neutral-300 hover:bg-neutral-900"
                    }`}
                  >
                    {r.title}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {selected.length > 0 && (
          <p className="mt-2 text-xs text-neutral-500">
            {selected.length} referencia(s) seleccionada(s).
          </p>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={busy}
        className="self-start rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
      >
        {busy ? "Generando…" : "Generar título y miniatura"}
      </button>
    </div>
  );
}
