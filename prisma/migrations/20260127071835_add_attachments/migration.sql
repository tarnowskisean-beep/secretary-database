-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "personId" TEXT,
    "entityId" TEXT,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'LINK',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Attachment_personId_idx" ON "Attachment"("personId");

-- CreateIndex
CREATE INDEX "Attachment_entityId_idx" ON "Attachment"("entityId");

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
