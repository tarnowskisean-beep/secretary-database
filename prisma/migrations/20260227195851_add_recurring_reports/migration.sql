-- AlterTable
ALTER TABLE "Entity" ADD COLUMN     "hasRecurringAnnualReport" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recurringReportDueDay" INTEGER,
ADD COLUMN     "recurringReportDueMonth" INTEGER;
