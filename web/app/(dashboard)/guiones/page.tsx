import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SCRIPT_PHASE_LABEL } from "./phaseLabels";

export default async function GuionesPage() {
  const scripts = await prisma.script.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { sourceThumbnailIdea: { select: { chosenTitle: true } } },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-semibold text-neutral-100">Guiones</h1>
          <p className="text-sm text-neutral-500">
            Guionizá un caso siguiendo el proceso en fases: investigación, título, intro y
            outline, con la regla de veracidad aplicada en cada paso.
          </p>
        </div>
        <Link
          href="/guiones/nuevo"
          className="rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600"
        >
          + Nuevo guion
        </Link>
      </div>

      {scripts.length === 0 ? (
        <p className="text-sm text-neutral-500">
          Todavía no creaste ningún guion. Empezá desde una idea ya elegida en
          &quot;Títulos y miniaturas&quot;, o creá uno desde cero con &quot;+ Nuevo guion&quot;.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {scripts.map((script) => (
            <Link
              key={script.id}
              href={`/guiones/${script.id}`}
              className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-950 p-4 hover:bg-neutral-900"
            >
              <div>
                <p className="text-sm font-medium text-neutral-100">
                  {script.chosenTitle ?? script.title ?? "Título por definir"}
                </p>
                {script.sourceThumbnailIdea?.chosenTitle && (
                  <p className="mt-1 text-xs text-neutral-500">
                    Desde: {script.sourceThumbnailIdea.chosenTitle}
                  </p>
                )}
              </div>
              <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs font-medium text-neutral-300">
                {SCRIPT_PHASE_LABEL[script.currentPhase]}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
