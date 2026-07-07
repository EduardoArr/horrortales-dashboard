"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { OutlierStatus } from "@prisma/client";

export async function updateOutlierStatus(
  outlierId: string,
  status: OutlierStatus
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  await prisma.outlier.update({
    where: { id: outlierId },
    data: {
      status,
      statusUpdatedAt: new Date(),
      statusUpdatedById: session.user.id,
    },
  });

  revalidatePath("/outliers");
  revalidatePath("/titulos-miniaturas/nuevo");
}

/** Permanently excludes a channel from future discovery scoring — the
 *  content-filter heuristics (lib/discovery/contentFilter.ts) can't catch
 *  every off-topic channel (e.g. political podcasts, general history
 *  channels), so this is the manual escape hatch. scoreChannels.ts only
 *  scores channels with status "CANDIDATE", so BLOCKED channels are skipped
 *  on every future run without spending quota on them again. */
export async function blockChannel(channelId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  await prisma.$transaction([
    prisma.channel.update({
      where: { id: channelId },
      data: { status: "BLOCKED" },
    }),
    prisma.outlier.updateMany({
      where: { channelId, status: { not: "USED" } },
      data: {
        status: "DISCARDED",
        statusUpdatedAt: new Date(),
        statusUpdatedById: session.user.id,
      },
    }),
  ]);

  revalidatePath("/outliers");
}
