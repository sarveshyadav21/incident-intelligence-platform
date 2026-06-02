-- AlterTable
ALTER TABLE "incidents" ADD COLUMN     "aiSeverity" TEXT,
ADD COLUMN     "remediationSteps" JSONB,
ADD COLUMN     "rootCause" TEXT;
