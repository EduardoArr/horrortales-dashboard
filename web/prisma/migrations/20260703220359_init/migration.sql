-- CreateEnum
CREATE TYPE "ChannelSource" AS ENUM ('SEARCH_DISCOVERY', 'MANUAL_SEED', 'MANUAL_ADDED');

-- CreateEnum
CREATE TYPE "ChannelStatus" AS ENUM ('CANDIDATE', 'REJECTED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "OutlierStatus" AS ENUM ('NEW', 'SAVED', 'DISCARDED', 'USED');

-- CreateEnum
CREATE TYPE "TriggerSource" AS ENUM ('CRON', 'MANUAL');

-- CreateEnum
CREATE TYPE "DiscoveryRunStatus" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED', 'ABORTED_QUOTA');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Channel" (
    "id" TEXT NOT NULL,
    "youtubeChannelId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "handle" TEXT,
    "country" TEXT,
    "isCountryVerified" BOOLEAN NOT NULL DEFAULT false,
    "subscriberCount" INTEGER NOT NULL,
    "channelPublishedAt" TIMESTAMP(3) NOT NULL,
    "uploadsPlaylistId" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "source" "ChannelSource" NOT NULL,
    "status" "ChannelStatus" NOT NULL DEFAULT 'CANDIDATE',
    "rejectionReason" TEXT,
    "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastCheckedAt" TIMESTAMP(3),
    "discoveredViaKeywordId" TEXT,

    CONSTRAINT "Channel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Outlier" (
    "id" TEXT NOT NULL,
    "youtubeVideoId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "views" INTEGER NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "vpd" DOUBLE PRECISION NOT NULL,
    "channelBaselineVpd" DOUBLE PRECISION NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "viewsVsSubs" DOUBLE PRECISION NOT NULL,
    "subscriberCountAtCapture" INTEGER NOT NULL,
    "status" "OutlierStatus" NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "statusUpdatedAt" TIMESTAMP(3),
    "statusUpdatedById" TEXT,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastRefreshedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Outlier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KeywordSearch" (
    "id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "regionCode" TEXT NOT NULL DEFAULT 'US',
    "relevanceLanguage" TEXT NOT NULL DEFAULT 'en',
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resultCount" INTEGER NOT NULL,
    "quotaCost" INTEGER NOT NULL,
    "triggeredBy" "TriggerSource" NOT NULL,
    "triggeredById" TEXT,
    "runId" TEXT,

    CONSTRAINT "KeywordSearch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscoveryRun" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "trigger" "TriggerSource" NOT NULL,
    "triggeredById" TEXT,
    "keywordsRun" INTEGER NOT NULL DEFAULT 0,
    "channelsDiscovered" INTEGER NOT NULL DEFAULT 0,
    "channelsCandidates" INTEGER NOT NULL DEFAULT 0,
    "outliersFound" INTEGER NOT NULL DEFAULT 0,
    "quotaUnitsUsed" INTEGER NOT NULL DEFAULT 0,
    "status" "DiscoveryRunStatus" NOT NULL DEFAULT 'RUNNING',
    "errorMessage" TEXT,

    CONSTRAINT "DiscoveryRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotaUsage" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "unitsUsed" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuotaUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Channel_youtubeChannelId_key" ON "Channel"("youtubeChannelId");

-- CreateIndex
CREATE INDEX "Channel_status_lastCheckedAt_idx" ON "Channel"("status", "lastCheckedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Outlier_youtubeVideoId_key" ON "Outlier"("youtubeVideoId");

-- CreateIndex
CREATE INDEX "Outlier_status_score_idx" ON "Outlier"("status", "score");

-- CreateIndex
CREATE INDEX "KeywordSearch_keyword_executedAt_idx" ON "KeywordSearch"("keyword", "executedAt");

-- CreateIndex
CREATE UNIQUE INDEX "QuotaUsage_date_key" ON "QuotaUsage"("date");

-- AddForeignKey
ALTER TABLE "Channel" ADD CONSTRAINT "Channel_discoveredViaKeywordId_fkey" FOREIGN KEY ("discoveredViaKeywordId") REFERENCES "KeywordSearch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Outlier" ADD CONSTRAINT "Outlier_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Outlier" ADD CONSTRAINT "Outlier_statusUpdatedById_fkey" FOREIGN KEY ("statusUpdatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KeywordSearch" ADD CONSTRAINT "KeywordSearch_triggeredById_fkey" FOREIGN KEY ("triggeredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KeywordSearch" ADD CONSTRAINT "KeywordSearch_runId_fkey" FOREIGN KEY ("runId") REFERENCES "DiscoveryRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscoveryRun" ADD CONSTRAINT "DiscoveryRun_triggeredById_fkey" FOREIGN KEY ("triggeredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
