-- CreateEnum
CREATE TYPE "ThumbnailIdeaStatus" AS ENUM ('DRAFT', 'FINAL');

-- CreateEnum
CREATE TYPE "HostFeaturePreference" AS ENUM ('NONE', 'HOST_1', 'HOST_2', 'BOTH');

-- CreateTable
CREATE TABLE "HostPhoto" (
    "id" TEXT NOT NULL,
    "hostLabel" TEXT NOT NULL,
    "blobUrl" TEXT NOT NULL,
    "blobPathname" TEXT NOT NULL,
    "originalFilename" TEXT,
    "contentType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "notes" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedById" TEXT,

    CONSTRAINT "HostPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThumbnailIdea" (
    "id" TEXT NOT NULL,
    "sourceOutlierId" TEXT,
    "freeformIdea" TEXT,
    "requestedHostFeature" "HostFeaturePreference" NOT NULL DEFAULT 'NONE',
    "angleCandidates" JSONB NOT NULL,
    "chosenAngle" TEXT NOT NULL,
    "referenceAnalysis" JSONB,
    "titleCandidates" JSONB NOT NULL,
    "chosenTitle" TEXT NOT NULL,
    "thumbnailConcept" JSONB NOT NULL,
    "imagePrompt" TEXT NOT NULL,
    "status" "ThumbnailIdeaStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "ThumbnailIdea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ThumbnailIdeaReferences" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ThumbnailIdeaReferences_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "HostPhoto_hostLabel_idx" ON "HostPhoto"("hostLabel");

-- CreateIndex
CREATE INDEX "ThumbnailIdea_status_createdAt_idx" ON "ThumbnailIdea"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ThumbnailIdea_sourceOutlierId_idx" ON "ThumbnailIdea"("sourceOutlierId");

-- CreateIndex
CREATE INDEX "_ThumbnailIdeaReferences_B_index" ON "_ThumbnailIdeaReferences"("B");

-- AddForeignKey
ALTER TABLE "HostPhoto" ADD CONSTRAINT "HostPhoto_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThumbnailIdea" ADD CONSTRAINT "ThumbnailIdea_sourceOutlierId_fkey" FOREIGN KEY ("sourceOutlierId") REFERENCES "Outlier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThumbnailIdea" ADD CONSTRAINT "ThumbnailIdea_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ThumbnailIdeaReferences" ADD CONSTRAINT "_ThumbnailIdeaReferences_A_fkey" FOREIGN KEY ("A") REFERENCES "Outlier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ThumbnailIdeaReferences" ADD CONSTRAINT "_ThumbnailIdeaReferences_B_fkey" FOREIGN KEY ("B") REFERENCES "ThumbnailIdea"("id") ON DELETE CASCADE ON UPDATE CASCADE;
