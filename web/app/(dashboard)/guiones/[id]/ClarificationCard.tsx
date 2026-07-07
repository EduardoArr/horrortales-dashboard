"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { retryStage } from "./actions";

export function ClarificationCard({ id, question }: { id: string; question: string }) {
  const router = useRouter();
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, startRetry] = useTransition();

  function retry() {
    setError(null);
    if (!answer.trim()) {
      setError("Escribí una respuesta.");
      return;
    }
    startRetry(async () => {
      try {
        await retryStage(id, answer);
        setAnswer("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo reintentar.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-yellow-900/50 bg-yellow-950/10 p-4">
      <p className="text-sm font-medium text-yellow-200">Falta un dato para continuar</p>
      <p className="text-sm text-neutral-200">{question}</p>
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        rows={3}
        placeholder="Escribí el dato que falta..."
        className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600"
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="button"
        onClick={retry}
        disabled={isRetrying}
        className="self-start rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
      >
        {isRetrying ? "Reintentando…" : "Reintentar"}
      </button>
    </div>
  );
}
