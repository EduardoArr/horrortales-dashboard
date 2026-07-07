"use client";

import { useTransition } from "react";
import Link from "next/link";
import type { OutlierStatus } from "@prisma/client";
import { updateOutlierStatus } from "./actions";

export interface OutlierRow {
  id: string;
  title: string;
  description: string | null;
  url: string;
  thumbnailUrl: string | null;
  views: number;
  publishedAt: string;
  score: number;
  viewsVsSubs: number;
  status: OutlierStatus;
  channel: {
    title: string;
    country: string | null;
    isCountryVerified: boolean;
    subscriberCount: number;
    channelPublishedAt: string;
  };
}

const STATUS_LABEL: Record<OutlierStatus, string> = {
  NEW: "Nuevo",
  SAVED: "Guardado",
  DISCARDED: "Descartado",
  USED: "Usado",
};

function formatNumber(n: number): string {
  return new Intl.NumberFormat("es-ES").format(n);
}

function channelAgeMonths(channelPublishedAt: string): number {
  const ms = Date.now() - new Date(channelPublishedAt).getTime();
  return Math.round(ms / (30 * 86_400_000));
}

function scoreBadgeClass(score: number): string {
  if (score >= 10) return "bg-red-900/60 text-red-200";
  if (score >= 5) return "bg-orange-900/60 text-orange-200";
  return "bg-neutral-800 text-neutral-300";
}

export function OutlierTable({ outliers }: { outliers: OutlierRow[] }) {
  const [isPending, startTransition] = useTransition();

  function setStatus(id: string, status: OutlierStatus) {
    startTransition(async () => {
      await updateOutlierStatus(id, status);
    });
  }

  if (outliers.length === 0) {
    return (
      <p className="mt-8 text-sm text-neutral-500">
        No hay outliers que coincidan con estos filtros todavía.
      </p>
    );
  }

  return (
    <div className="mt-6 overflow-x-auto rounded-lg border border-neutral-800">
      <table className="w-full min-w-[900px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-neutral-800 text-left text-neutral-400">
            <th className="p-3 font-medium">Vídeo</th>
            <th className="p-3 font-medium">Canal</th>
            <th className="p-3 font-medium">Vistas</th>
            <th className="p-3 font-medium">Score</th>
            <th className="p-3 font-medium">Vistas/subs</th>
            <th className="p-3 font-medium">Estado</th>
            <th className="p-3 font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {outliers.map((outlier) => (
            <tr key={outlier.id} className="border-b border-neutral-900">
              <td className="p-3 max-w-sm">
                <a
                  href={outlier.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-neutral-100 hover:underline"
                >
                  {outlier.title}
                </a>
                {outlier.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-neutral-500">
                    {outlier.description}
                  </p>
                )}
                <div className="mt-1 text-xs text-neutral-600">
                  {new Date(outlier.publishedAt).toLocaleDateString("es-ES")}
                </div>
              </td>
              <td className="p-3 text-neutral-300">
                <div>{outlier.channel.title}</div>
                <div className="text-xs text-neutral-500">
                  {formatNumber(outlier.channel.subscriberCount)} subs ·{" "}
                  {outlier.channel.country ?? "país desconocido"}
                  {!outlier.channel.isCountryVerified && "?"} ·{" "}
                  {channelAgeMonths(outlier.channel.channelPublishedAt)} meses
                </div>
              </td>
              <td className="p-3 text-neutral-300">
                {formatNumber(outlier.views)}
              </td>
              <td className="p-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${scoreBadgeClass(outlier.score)}`}
                >
                  {outlier.score.toFixed(1)}x
                </span>
              </td>
              <td className="p-3 text-neutral-400">
                {(outlier.viewsVsSubs * 100).toFixed(0)}%
              </td>
              <td className="p-3 text-neutral-400">
                {STATUS_LABEL[outlier.status]}
              </td>
              <td className="p-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => setStatus(outlier.id, "SAVED")}
                    className="rounded-md border border-neutral-700 px-2 py-1 text-xs text-neutral-200 hover:bg-neutral-800 disabled:opacity-50"
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => setStatus(outlier.id, "DISCARDED")}
                    className="rounded-md border border-neutral-700 px-2 py-1 text-xs text-neutral-200 hover:bg-neutral-800 disabled:opacity-50"
                  >
                    Descartar
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => setStatus(outlier.id, "USED")}
                    className="rounded-md border border-neutral-700 px-2 py-1 text-xs text-neutral-200 hover:bg-neutral-800 disabled:opacity-50"
                  >
                    Usado
                  </button>
                  {(outlier.status === "SAVED" || outlier.status === "USED") && (
                    <Link
                      href={`/titulos-miniaturas/nuevo?outlierId=${outlier.id}`}
                      className="rounded-md border border-red-800 px-2 py-1 text-xs text-red-200 hover:bg-red-900/30"
                    >
                      Título y miniatura
                    </Link>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
