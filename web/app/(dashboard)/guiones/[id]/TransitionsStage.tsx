"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { OutlineSection, TransitionHookSet } from "@/lib/scripts/types";
import { chooseTransitionHook, runCtasStage, runTransitionsStage } from "./actions";

function JunctionCard({
  id,
  hook,
  afterTitle,
  beforeTitle,
}: {
  id: string;
  hook: TransitionHookSet;
  afterTitle: string;
  beforeTitle: string;
}) {
  const router = useRouter();
  const [chosenText, setChosenText] = useState(hook.chosenText ?? "");
  const [isSaving, startSave] = useTransition();

  function pick(text: string) {
    setChosenText(text);
    startSave(async () => {
      await chooseTransitionHook(id, hook.afterSectionOrder, text);
      router.refresh();
    });
  }

  return (
    <li className="rounded-md border border-neutral-800 bg-neutral-900 p-3 text-sm">
      <p className="text-xs text-neutral-500">
        Entre &quot;{afterTitle}&quot; y &quot;{beforeTitle}&quot;
      </p>
      <ul className="mt-2 flex flex-col gap-2">
        {hook.options.map((opt, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => pick(opt)}
              disabled={isSaving}
              className={`w-full rounded-md border px-3 py-2 text-left text-sm disabled:opacity-50 ${
                chosenText === opt
                  ? "border-red-800 bg-red-900/30 text-red-100"
                  : "border-neutral-800 bg-neutral-950 text-neutral-300 hover:bg-neutral-900"
              }`}
            >
              {opt}
            </button>
          </li>
        ))}
      </ul>
    </li>
  );
}

export function TransitionsStage({
  id,
  outlineSections,
  transitionHooks,
}: {
  id: string;
  outlineSections: OutlineSection[] | null;
  transitionHooks: TransitionHookSet[] | null;
}) {
  const router = useRouter();
  const [isRegenerating, startRegenerate] = useTransition();
  const [isAdvancing, startAdvance] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const titleByOrder = new Map((outlineSections ?? []).map((s) => [s.order, s.workingTitle]));
  const allChosen = (transitionHooks ?? []).every((h) => h.chosenText);

  function regenerate() {
    setError(null);
    startRegenerate(async () => {
      try {
        await runTransitionsStage(id);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudieron regenerar las transiciones.");
      }
    });
  }

  function continueToCtas() {
    setError(null);
    startAdvance(async () => {
      try {
        await runCtasStage(id);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudieron generar los CTAs.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-neutral-800 bg-neutral-950 p-4">
      <h2 className="text-sm font-medium text-neutral-300">Etapa 6 — Hooks de transición</h2>

      {transitionHooks && (
        <ul className="flex flex-col gap-3">
          {transitionHooks
            .slice()
            .sort((a, b) => a.afterSectionOrder - b.afterSectionOrder)
            .map((h) => (
              <JunctionCard
                key={h.afterSectionOrder}
                id={id}
                hook={h}
                afterTitle={titleByOrder.get(h.afterSectionOrder) ?? `Sección ${h.afterSectionOrder}`}
                beforeTitle={titleByOrder.get(h.afterSectionOrder + 1) ?? `Sección ${h.afterSectionOrder + 1}`}
              />
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
          onClick={continueToCtas}
          disabled={isAdvancing || !allChosen}
          className="rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
        >
          {isAdvancing ? "Generando…" : "Continuar a CTAs"}
        </button>
      </div>
    </div>
  );
}
