-- AlterTable
ALTER TABLE "Script" ADD COLUMN     "ctas" JSONB,
ADD COLUMN     "editedFinalScript" TEXT,
ADD COLUMN     "payoffs" JSONB,
ADD COLUMN     "styleGuideReport" JSONB,
ADD COLUMN     "transitionHooks" JSONB;

-- CreateTable
CREATE TABLE "ScriptSection" (
    "id" TEXT NOT NULL,
    "scriptId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "variations" JSONB,
    "chosenText" TEXT,
    "pendingClarification" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScriptSection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScriptSection_scriptId_order_idx" ON "ScriptSection"("scriptId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "ScriptSection_scriptId_order_key" ON "ScriptSection"("scriptId", "order");

-- AddForeignKey
ALTER TABLE "ScriptSection" ADD CONSTRAINT "ScriptSection_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "Script"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
