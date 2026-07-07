import { prisma } from "@/lib/prisma";
import { deleteHostPhoto, uploadHostPhoto } from "./actions";

export default async function HostPhotosPage() {
  const photos = await prisma.hostPhoto.findMany({ orderBy: { uploadedAt: "desc" } });

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-neutral-100">
        Fotos de los presentadores
      </h1>
      <p className="mb-6 text-sm text-neutral-500">
        Subilas una vez y reutilizalas al generar títulos y miniaturas — sirven de
        referencia para adjuntar a mano cuando pegues el prompt de imagen en ChatGPT.
      </p>

      <form
        action={uploadHostPhoto}
        className="mb-8 flex flex-wrap items-end gap-3 rounded-lg border border-neutral-800 bg-neutral-950 p-4"
      >
        <div className="flex flex-col gap-1">
          <label className="text-xs text-neutral-400" htmlFor="hostLabel">
            Presentador
          </label>
          <input
            id="hostLabel"
            name="hostLabel"
            list="host-labels"
            required
            placeholder="Host 1"
            className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100"
          />
          <datalist id="host-labels">
            <option value="Host 1" />
            <option value="Host 2" />
          </datalist>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-neutral-400" htmlFor="notes">
            Nota (opcional)
          </label>
          <input
            id="notes"
            name="notes"
            placeholder="primer plano, sorprendido"
            className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-neutral-400" htmlFor="file">
            Foto
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

      {photos.length === 0 ? (
        <p className="text-sm text-neutral-500">Todavía no subiste ninguna foto.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.blobUrl}
                alt={photo.hostLabel}
                className="aspect-square w-full object-cover"
              />
              <div className="p-2">
                <p className="truncate text-sm text-neutral-200">{photo.hostLabel}</p>
                {photo.notes && (
                  <p className="truncate text-xs text-neutral-500">{photo.notes}</p>
                )}
                <form action={deleteHostPhoto.bind(null, photo.id)}>
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
