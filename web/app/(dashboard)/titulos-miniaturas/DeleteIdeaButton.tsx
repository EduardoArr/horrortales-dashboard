"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteThumbnailIdea } from "./[id]/actions";

export function DeleteIdeaButton({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("¿Eliminar este borrador? Esta acción no se puede deshacer.")) {
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await deleteThumbnailIdea(id);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo eliminar.");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-red-400">{error}</span>}
      <button
        type="button"
        disabled={isPending}
        onClick={onClick}
        className="rounded-md border border-neutral-700 px-2 py-1 text-xs text-neutral-300 hover:border-red-800 hover:bg-red-900/30 hover:text-red-200 disabled:opacity-50"
      >
        {isPending ? "Eliminando…" : "Eliminar"}
      </button>
    </div>
  );
}
