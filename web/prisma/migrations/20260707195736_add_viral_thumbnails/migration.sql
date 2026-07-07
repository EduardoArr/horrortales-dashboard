-- CreateTable
CREATE TABLE "ViralThumbnail" (
    "id" TEXT NOT NULL,
    "blobUrl" TEXT NOT NULL,
    "blobPathname" TEXT NOT NULL,
    "originalFilename" TEXT,
    "contentType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "label" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedById" TEXT,

    CONSTRAINT "ViralThumbnail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ThumbnailIdeaViralReferences" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ThumbnailIdeaViralReferences_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ThumbnailIdeaViralReferences_B_index" ON "_ThumbnailIdeaViralReferences"("B");

-- AddForeignKey
ALTER TABLE "ViralThumbnail" ADD CONSTRAINT "ViralThumbnail_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ThumbnailIdeaViralReferences" ADD CONSTRAINT "_ThumbnailIdeaViralReferences_A_fkey" FOREIGN KEY ("A") REFERENCES "ThumbnailIdea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ThumbnailIdeaViralReferences" ADD CONSTRAINT "_ThumbnailIdeaViralReferences_B_fkey" FOREIGN KEY ("B") REFERENCES "ViralThumbnail"("id") ON DELETE CASCADE ON UPDATE CASCADE;
