"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export interface DiscoveryPanelProps {
  remainingUnitsToday: number;
  dailyQuotaCap: number;
}

export function DiscoveryPanel({
  remainingUnitsToday,
  dailyQuotaCap,
}: DiscoveryPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function triggerDiscovery() {
    setMessage(null);
    startTransition(async () => {
      const res = await fetch("/api/outliers/discover", { method: "POST" });
      if (res.status === 429) {
        setMessage("Cuota diaria de YouTube agotada, prueba mañana.");
        return;
      }
      if (!res.ok) {
        setMessage("Algo falló buscando nuevas ideas.");
        return;
      }
      const result = await res.json();
      setMessage(
        `Búsqueda completada: ${result.outliersFound} outliers nuevos, ` +
          `${result.channelsCandidates} canales candidatos.`
      );
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-neutral-800 bg-neutral-950 p-4">
      <div className="text-sm text-neutral-400">
        Cuota YouTube hoy:{" "}
        <span className="text-neutral-200">
          {remainingUnitsToday} / {dailyQuotaCap} unidades restantes
        </span>
      </div>

      <div className="flex items-center gap-3">
        {message && <span className="text-sm text-neutral-400">{message}</span>}
        <button
          type="button"
          disabled={isPending || remainingUnitsToday < 100}
          onClick={triggerDiscovery}
          className="rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
        >
          {isPending ? "Buscando…" : "Buscar nuevas ideas"}
        </button>
      </div>
    </div>
  );
}
