import { prisma } from "../prisma";
import type { TriggerSource } from "@prisma/client";
import { discoverChannels, ENGLISH_POOL, SPANISH_POOL } from "./discoverChannels";
import { scoreChannels } from "./scoreChannels";

export interface RunDiscoveryResult {
  runId: string;
  status: "COMPLETED" | "ABORTED_QUOTA" | "FAILED";
  keywordsRun: number;
  channelsDiscovered: number;
  channelsCandidates: number;
  outliersFound: number;
  quotaUnitsUsed: number;
  errorMessage?: string;
}

export async function runDiscovery(
  trigger: TriggerSource,
  triggeredById?: string
): Promise<RunDiscoveryResult> {
  const run = await prisma.discoveryRun.create({
    data: { trigger, triggeredById, status: "RUNNING" },
  });

  try {
    const discoveryEn = await discoverChannels(run.id, trigger, triggeredById, ENGLISH_POOL);
    const discoveryEs = await discoverChannels(run.id, trigger, triggeredById, SPANISH_POOL);
    const scoring = await scoreChannels();

    const keywordsRun = discoveryEn.keywordsRun + discoveryEs.keywordsRun;
    const channelsDiscovered = discoveryEn.channelsDiscovered + discoveryEs.channelsDiscovered;
    const channelsAccepted = discoveryEn.channelsAccepted + discoveryEs.channelsAccepted;
    const status =
      discoveryEn.abortedOnQuota || discoveryEs.abortedOnQuota || scoring.abortedOnQuota
        ? "ABORTED_QUOTA"
        : "COMPLETED";
    const quotaUnitsUsed =
      discoveryEn.quotaUnitsUsed + discoveryEs.quotaUnitsUsed + scoring.quotaUnitsUsed;

    await prisma.discoveryRun.update({
      where: { id: run.id },
      data: {
        finishedAt: new Date(),
        status,
        keywordsRun,
        channelsDiscovered,
        channelsCandidates: channelsAccepted,
        outliersFound: scoring.outliersFound,
        quotaUnitsUsed,
      },
    });

    return {
      runId: run.id,
      status,
      keywordsRun,
      channelsDiscovered,
      channelsCandidates: channelsAccepted,
      outliersFound: scoring.outliersFound,
      quotaUnitsUsed,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await prisma.discoveryRun.update({
      where: { id: run.id },
      data: { finishedAt: new Date(), status: "FAILED", errorMessage },
    });
    return {
      runId: run.id,
      status: "FAILED",
      keywordsRun: 0,
      channelsDiscovered: 0,
      channelsCandidates: 0,
      outliersFound: 0,
      quotaUnitsUsed: 0,
      errorMessage,
    };
  }
}
