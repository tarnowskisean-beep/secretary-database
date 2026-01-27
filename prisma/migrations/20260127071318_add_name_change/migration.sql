-- CreateTable
CREATE TABLE "NameChange" (
    "id" TEXT NOT NULL,
    "personId" TEXT,
    "entityId" TEXT,
    "oldName" TEXT NOT NULL,
    "newName" TEXT NOT NULL,
    "documentUrl" TEXT,
    "changedBy" TEXT,
    "changeDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NameChange_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NameChange_personId_idx" ON "NameChange"("personId");

-- CreateIndex
CREATE INDEX "NameChange_entityId_idx" ON "NameChange"("entityId");

-- AddForeignKey
ALTER TABLE "NameChange" ADD CONSTRAINT "NameChange_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NameChange" ADD CONSTRAINT "NameChange_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
