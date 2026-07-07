-- CreateEnum
CREATE TYPE "ScriptTitleMode" AS ENUM ('VALIDATE', 'GENERATE');

-- CreateEnum
CREATE TYPE "ScriptPhase" AS ENUM ('TITLE', 'INTRO', 'OUTLINE', 'PAYOFFS', 'SECTIONS', 'TRANSITIONS', 'CTAS', 'STYLE_REVIEW', 'COMPLETE');

-- CreateTable
CREATE TABLE "Script" (
    "id" TEXT NOT NULL,
    "sourceThumbnailIdeaId" TEXT,
    "title" TEXT,
    "thumbnailDescription" TEXT NOT NULL,
    "research" TEXT NOT NULL,
    "referenceScript" TEXT,
    "brainDump" TEXT,
    "titleMode" "ScriptTitleMode" NOT NULL,
    "titleAssessment" JSONB,
    "titleCandidates" JSONB,
    "chosenTitle" TEXT,
    "introVariations" JSONB,
    "chosenIntroAngle" TEXT,
    "chosenIntro" TEXT,
    "outlineSections" JSONB,
    "currentPhase" "ScriptPhase" NOT NULL DEFAULT 'TITLE',
    "pendingClarification" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "Script_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScriptClarification" (
    "id" TEXT NOT NULL,
    "scriptId" TEXT NOT NULL,
    "phase" "ScriptPhase" NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScriptClarification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Script_currentPhase_createdAt_idx" ON "Script"("currentPhase", "createdAt");

-- CreateIndex
CREATE INDEX "Script_sourceThumbnailIdeaId_idx" ON "Script"("sourceThumbnailIdeaId");

-- CreateIndex
CREATE INDEX "ScriptClarification_scriptId_phase_idx" ON "ScriptClarification"("scriptId", "phase");

-- AddForeignKey
ALTER TABLE "Script" ADD CONSTRAINT "Script_sourceThumbnailIdeaId_fkey" FOREIGN KEY ("sourceThumbnailIdeaId") REFERENCES "ThumbnailIdea"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Script" ADD CONSTRAINT "Script_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScriptClarification" ADD CONSTRAINT "ScriptClarification_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "Script"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
