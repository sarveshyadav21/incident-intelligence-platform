-- CreateTable
CREATE TABLE "incident_timeline_events" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT,
    "jobId" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incident_timeline_events_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "incident_timeline_events" ADD CONSTRAINT "incident_timeline_events_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
