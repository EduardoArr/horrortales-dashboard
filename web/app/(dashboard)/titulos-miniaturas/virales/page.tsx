import { prisma } from "@/lib/prisma";
import { deleteViralThumbnail, uploadViralThumbnail } from "./actions";

export default async function ViralThumbnailsPage() {
  const thumbnails = await prisma.viralThumbnail.findMany({ orderBy: { uploadedAt: "desc" } });

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-neutral-100">
        Miniaturas virales de referencia
      </h1>
      <p className="mb-6 text-sm text-neutral-500">
        Subí capturas de miniaturas que te funcionaron a otros canales del nicho. Al generar
        un título/miniatura, podés elegirlas como referencia visual — Claude las analiza
        (encuadre, ángulo de cámara, contraste, qué muestra y qué oculta) y usa esos patrones
        para armar un mejor concepto y prompt de imagen, sin copiar el contenido literal.
      </p>

      <form
        action={uploadViralThumbnail}
        className="mb-8 flex flex-wrap items-end gap-3 rounded-lg border border-neutral-800 bg-neutral-950 p-4"
      >
        <div className="flex flex-col gap-1">
          <label className="text-xs text-neutral-400" htmlFor="label">
            Nota (opcional)
          </label>
          <input
            id="label"
            name="label"
            placeholder="Ej. primer plano, contraste rojo/azul"
            className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-neutral-400" htmlFor="file">
            Miniatura
          </label>
          <input
            id="file"
            name="file"
            type="file"
            accept="image/*"
            required
            className="text-sm text-neutral-300"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600"
        >
          Subir
        </button>
      </form>

      {thumbnails.length === 0 ? (
        <p className="text-sm text-neutral-500">Todavía no subiste ninguna miniatura viral.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {thumbnails.map((thumb) => (
            <div
              key={thumb.id}
              className="overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumb.blobUrl}
                alt={thumb.label ?? thumb.originalFilename ?? "Miniatura viral"}
                className="aspect-video w-full object-cover"
              />
              <div className="p-2">
                {thumb.label && (
                  <p className="truncate text-sm text-neutral-200">{thumb.label}</p>
                )}
                <form action={deleteViralThumbnail.bind(null, thumb.id)}>
                  <button
                    type="submit"
                    className="mt-1 text-xs text-red-400 hover:underline"
                  >
                    Borrar
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
