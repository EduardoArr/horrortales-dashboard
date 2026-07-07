import { prisma } from "@/lib/prisma";
import { NewIdeaForm } from "./NewIdeaForm";

export default async function NewThumbnailIdeaPage({
  searchParams,
}: {
  searchParams: Promise<{ outlierId?: string }>;
}) {
  const { outlierId } = await searchParams;

  const [outlier, savedOutliers, viralThumbnails] = await Promise.all([
    outlierId
      ? prisma.outlier.findUnique({
          where: { id: outlierId },
          select: { id: true, title: true, description: true, thumbnailUrl: true },
        })
      : Promise.resolve(null),
    prisma.outlier.findMany({
      where: { status: "SAVED" },
      orderBy: { score: "desc" },
      take: 30,
      select: {
        id: true,
        title: true,
        description: true,
        thumbnailUrl: true,
        views: true,
        score: true,
        channel: { select: { title: true } },
      },
    }),
    prisma.viralThumbnail.findMany({
      orderBy: { uploadedAt: "desc" },
      select: { id: true, label: true, blobUrl: true },
    }),
  ]);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-neutral-100">Nueva idea</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Generá el ángulo, título y concepto de miniatura para esta idea de video.
      </p>

      <NewIdeaForm
        initialOutlier={outlier}
        savedOutliers={savedOutliers.map((o) => ({
          id: o.id,
          title: o.title,
          description: o.description,
          thumbnailUrl: o.thumbnailUrl,
          views: o.views,
          score: o.score,
          channelTitle: o.channel.title,
        }))}
        viralThumbnails={viralThumbnails}
      />
    </div>
  );
}
