-- CreateTable
CREATE TABLE "incident_analysis_jobs" (
    "id" TEXT NOT NULL,
    "trackingId" TEXT NOT NULL,
    "bullmqJobId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incident_analysis_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "incident_analysis_jobs_trackingId_key" ON "incident_analysis_jobs"("trackingId");

-- CreateIndex
CREATE UNIQUE INDEX "incident_analysis_jobs_bullmqJobId_key" ON "incident_analysis_jobs"("bullmqJobId");
