"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { IntroVariation } from "@/lib/scripts/types";
import { runOutlineStage, updateScript } from "./actions";

export function IntroStage({
  id,
  introVariations,
  chosenIntroAngle: initialChosenAngle,
  chosenIntro: initialChosenIntro,
}: {
  id: string;
  introVariations: IntroVariation[] | null;
  chosenIntroAngle: string | null;
  chosenIntro: string | null;
}) {
  const router = useRouter();
  const [chosenAngle, setChosenAngle] = useState(initialChosenAngle);
  const [chosenIntro, setChosenIntro] = useState(initialChosenIntro ?? "");
  const [brainDump, setBrainDump] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSave] = useTransition();
  const [isAdvancing, startAdvance] = useTransition();

  function selectVariation(v: IntroVariation) {
    setChosenAngle(v.angle);
    setChosenIntro(v.text);
    startSave(async () => {
      await updateScript(id, { chosenIntroAngle: v.angle, chosenIntro: v.text });
      router.refresh();
    });
  }

  function saveIntro() {
    startSave(async () => {
      await updateScript(id, { chosenIntro });
      router.refresh();
    });
  }

  function continueToOutline() {
    setError(null);
    if (!brainDump.trim()) {
      setError("Escribí el brain dump antes de continuar.");
      return;
    }
    startAdvance(async () => {
      try {
        await runOutlineStage(id, brainDump);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo generar el outline.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-neutral-800 bg-neutral-950 p-4">
      <h2 className="text-sm font-medium text-neutral-300">Etapa 2 — Intro</h2>

      {introVariations && (
        <ul className="flex flex-col gap-2">
          {introVariations.map((v) => (
            <li key={v.angle}>
              <button
                type="button"
                onClick={() => selectVariation(v)}
                className={`w-full rounded-md border px-3 py-2 text-left text-sm ${
                  chosenAngle === v.angle
                    ? "border-red-800 bg-red-900/30 text-red-100"
                    : "border-neutral-800 bg-neutral-950 text-neutral-300 hover:bg-neutral-900"
                }`}
              >
                <p className="text-xs uppercase text-neutral-500">
                  {v.angle} · {v.wordCount} palabras
                </p>
                <p className="mt-1">{v.text}</p>
                {v.qaWarnings.length > 0 && (
                  <ul className="mt-2 flex flex-col gap-1">
                    {v.qaWarnings.map((w, i) => (
                      <li key={i} className="text-xs text-yellow-300">
                        ⚠ {w}
                      </li>
                    ))}
                  </ul>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div>
        <p className="mb-1 text-xs text-neutral-500">Intro elegida (editable)</p>
        <textarea
          value={chosenIntro}
          onChange={(e) => setChosenIntro(e.target.value)}
          rows={4}
          className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100"
        />
        <button
          type="button"
          onClick={saveIntro}
          disabled={isSaving}
          className="mt-2 rounded-md border border-neutral-700 px-3 py-2 text-xs text-neutral-200 hover:bg-neutral-800 disabled:opacity-50"
        >
          Guardar
        </button>
      </div>

      <div>
        <p className="mb-1 text-xs text-neutral-500">
          Brain dump (todo lo que sabés del tema, sin orden — además de la investigación)
        </p>
        <textarea
          value={brainDump}
          onChange={(e) => setBrainDump(e.target.value)}
          rows={5}
          placeholder="Volcá acá todo lo que te parece importante del caso, sin ordenar..."
          className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="button"
        onClick={continueToOutline}
        disabled={isAdvancing || !chosenIntro.trim()}
        className="self-start rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
      >
        {isAdvancing ? "Generando…" : "Continuar a Outline"}
      </button>
    </div>
  );
}
