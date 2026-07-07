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
