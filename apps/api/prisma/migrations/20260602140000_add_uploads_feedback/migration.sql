-- CreateEnum
CREATE TYPE "UploadStatus" AS ENUM ('PENDING', 'PARSED', 'FAILED');

-- CreateEnum
CREATE TYPE "FeedbackAction" AS ENUM ('ACCEPT', 'REJECT', 'EDIT');

-- AlterTable
ALTER TABLE "uploads" ADD COLUMN "parsedText" TEXT,
ADD COLUMN "status" "UploadStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "incident_feedback" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "action" "FeedbackAction" NOT NULL,
    "originalValue" TEXT,
    "correctedValue" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incident_feedback_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "incident_feedback" ADD CONSTRAINT "incident_feedback_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
