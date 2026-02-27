-- CreateTable
CREATE TABLE "AnnualReport" (
    "id" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3),
    "filingDate" TIMESTAMP(3),
    "documentUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnnualReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnnualReport_entityId_idx" ON "AnnualReport"("entityId");

-- CreateIndex
CREATE INDEX "AnnualReport_year_idx" ON "AnnualReport"("year");

-- CreateIndex
CREATE INDEX "AnnualReport_status_idx" ON "AnnualReport"("status");

-- AddForeignKey
ALTER TABLE "AnnualReport" ADD CONSTRAINT "AnnualReport_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
