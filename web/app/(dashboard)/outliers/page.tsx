import { prisma } from "@/lib/prisma";
import { remainingUnitsToday } from "@/lib/discovery/quota";
import {
  DAILY_QUOTA_CAP,
  MIN_CHANNEL_AGE_MONTHS,
  MIN_SUBSCRIBERS,
  MIN_VIDEO_VIEWS,
} from "@/lib/discovery/config";
import type { OutlierStatus, Prisma } from "@prisma/client";
import { OutlierFilters } from "./OutlierFilters";
import { OutlierTable, type OutlierRow } from "./OutlierTable";
import { DiscoveryPanel } from "./DiscoveryPanel";

const STATUS_VALUES: OutlierStatus[] = ["NEW", "SAVED", "DISCARDED", "USED"];

function parseStatus(raw: string | undefined): OutlierStatus | "ALL" {
  if (raw === "ALL") return "ALL";
  if (raw && STATUS_VALUES.includes(raw as OutlierStatus)) {
    return raw as OutlierStatus;
  }
  return "NEW";
}

function parseSort(raw: string | undefined): "score" | "views" | "publishedAt" {
  if (raw === "views" || raw === "publishedAt") return raw;
  return "score";
}

export default async function OutliersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; minScore?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const status = parseStatus(params.status);
  const minScore = Number(params.minScore ?? "0") || 0;
  const sort = parseSort(params.sort);

  const oldestAllowedChannel = new Date(
    Date.now() - MIN_CHANNEL_AGE_MONTHS * 30 * 86_400_000
  );

  const where: Prisma.OutlierWhereInput = {
    score: { gte: minScore },
    views: { gt: MIN_VIDEO_VIEWS },
    channel: {
      subscriberCount: { gt: MIN_SUBSCRIBERS },
      channelPublishedAt: { lte: oldestAllowedChannel },
    },
    ...(status === "ALL" ? {} : { status }),
  };

  const orderBy: Prisma.OutlierOrderByWithRelationInput =
    sort === "views"
      ? { views: "desc" }
      : sort === "publishedAt"
        ? { publishedAt: "desc" }
        : { score: "desc" };

  const [outliers, remaining] = await Promise.all([
    prisma.outlier.findMany({
      where,
      orderBy,
      take: 100,
      include: {
        channel: {
          select: {
            title: true,
            country: true,
            isCountryVerified: true,
            subscriberCount: true,
            channelPublishedAt: true,
          },
        },
      },
    }),
    remainingUnitsToday(),
  ]);

  const rows: OutlierRow[] = outliers.map((o) => ({
    id: o.id,
    title: o.title,
    description: o.description,
    url: o.url,
    thumbnailUrl: o.thumbnailUrl,
    views: o.views,
    publishedAt: o.publishedAt.toISOString(),
    score: o.score,
    viewsVsSubs: o.viewsVsSubs,
    status: o.status,
    channel: {
      title: o.channel.title,
      country: o.channel.country,
      isCountryVerified: o.channel.isCountryVerified,
      subscriberCount: o.channel.subscriberCount,
      channelPublishedAt: o.channel.channelPublishedAt.toISOString(),
    },
  }));

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-neutral-100">
        Buscador de ideas virales
      </h1>
      <p className="mb-6 text-sm text-neutral-500">
        Outliers de canales pequeños y recientes en el nicho de terror /
        misterio / true crime, descubiertos automáticamente en EE. UU.
      </p>

      <DiscoveryPanel
        remainingUnitsToday={remaining}
        dailyQuotaCap={DAILY_QUOTA_CAP}
      />

      <div className="mt-4">
        <OutlierFilters
          value={{
            status,
            minScore: String(minScore),
            sort,
          }}
        />
      </div>

      <OutlierTable outliers={rows} />
    </div>
  );
}
