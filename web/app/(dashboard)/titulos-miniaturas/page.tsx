import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DeleteIdeaButton } from "./DeleteIdeaButton";

export default async function TitulosMiniaturasPage() {
  const ideas = await prisma.thumbnailIdea.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { sourceOutlier: { select: { title: true } } },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-semibold text-neutral-100">
            Títulos y miniaturas
          </h1>
          <p className="text-sm text-neutral-500">
            Generá el ángulo, título y prompt de miniatura para una idea de video ya
            elegida.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/titulos-miniaturas/virales"
            className="rounded-md border border-neutral-700 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-800"
          >
            Miniaturas virales
          </Link>
          <Link
            href="/titulos-miniaturas/fotos"
            className="rounded-md border border-neutral-700 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-800"
          >
            Fotos de presentadores
          </Link>
          <Link
            href="/titulos-miniaturas/nuevo"
            className="rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600"
          >
            + Nueva idea
          </Link>
        </div>
      </div>

      {ideas.length === 0 ? (
        <p className="text-sm text-neutral-500">
          Todavía no generaste ningún título/miniatura. Elegí una idea guardada en el
          buscador de outliers, o creá una desde cero con &quot;+ Nueva idea&quot;.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {ideas.map((idea) => (
            <div
              key={idea.id}
              className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-950 p-4 hover:bg-neutral-900"
            >
              <Link href={`/titulos-miniaturas/${idea.id}`} className="flex-1">
                <p className="text-sm font-medium text-neutral-100">{idea.chosenTitle}</p>
                <p className="text-xs text-neutral-500">
                  {idea.sourceOutlier?.title ?? idea.freeformIdea}
                </p>
              </Link>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    idea.status === "FINAL"
                      ? "bg-green-900/60 text-green-200"
                      : "bg-neutral-800 text-neutral-300"
                  }`}
                >
                  {idea.status === "FINAL" ? "Final" : "Borrador"}
                </span>
                {idea.status === "DRAFT" && <DeleteIdeaButton id={idea.id} />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
