-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'INCIDENT_COMMANDER', 'ENGINEER', 'VIEWER');

-- AlterTable incident_analysis_jobs
ALTER TABLE "incident_analysis_jobs" ADD COLUMN IF NOT EXISTS "incidentId" TEXT;
ALTER TABLE "incident_analysis_jobs" ADD COLUMN IF NOT EXISTS "attemptCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "incident_analysis_jobs" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable uploads
ALTER TABLE "uploads" ADD COLUMN IF NOT EXISTS "fileSize" INTEGER;
ALTER TABLE "uploads" ADD COLUMN IF NOT EXISTS "previewUrl" TEXT;

-- AlterTable incident_feedback
ALTER TABLE "incident_feedback" ADD COLUMN IF NOT EXISTS "rating" INTEGER;
ALTER TABLE "incident_feedback" ADD COLUMN IF NOT EXISTS "category" TEXT;

-- CreateTable analysis_runs
CREATE TABLE "analysis_runs" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "runNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "rootCause" TEXT,
    "aiSummary" TEXT,
    "remediationSteps" JSONB,
    "confidenceScore" DOUBLE PRECISION,
    "aiSeverity" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "analysis_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable similar_incident_snapshots
CREATE TABLE "similar_incident_snapshots" (
    "id" TEXT NOT NULL,
    "analysisRunId" TEXT,
    "sourceIncidentId" TEXT NOT NULL,
    "targetIncidentId" TEXT NOT NULL,
    "targetTitle" TEXT NOT NULL,
    "similarity" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "similar_incident_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable agent_run_metrics
CREATE TABLE "agent_run_metrics" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "agent" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL,
    "tokenCountEstimate" INTEGER,
    "costEstimate" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "agent_run_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable prompt_versions
CREATE TABLE "prompt_versions" (
    "id" TEXT NOT NULL,
    "agent" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "promptContent" TEXT NOT NULL,
    "modelUsed" TEXT NOT NULL,
    "jobId" TEXT,
    "incidentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "prompt_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable executive_summaries
CREATE TABLE "executive_summaries" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "analysisRunId" TEXT,
    "overview" TEXT NOT NULL,
    "customerImpact" TEXT NOT NULL,
    "rootCause" TEXT NOT NULL,
    "actionsTaken" TEXT NOT NULL,
    "followUps" TEXT NOT NULL,
    "fullContent" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "executive_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable postmortems
CREATE TABLE "postmortems" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "analysisRunId" TEXT,
    "markdown" TEXT NOT NULL,
    "sections" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "postmortems_pkey" PRIMARY KEY ("id")
);

-- CreateTable dependency_graphs
CREATE TABLE "dependency_graphs" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "analysisRunId" TEXT,
    "nodes" JSONB NOT NULL,
    "edges" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "dependency_graphs_pkey" PRIMARY KEY ("id")
);

-- CreateTable audit_logs
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "userId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable organizations
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable teams
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable team_members
CREATE TABLE "team_members" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'VIEWER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "analysis_runs_incidentId_idx" ON "analysis_runs"("incidentId");
CREATE INDEX "agent_run_metrics_incidentId_idx" ON "agent_run_metrics"("incidentId");
CREATE INDEX "agent_run_metrics_jobId_idx" ON "agent_run_metrics"("jobId");
CREATE INDEX "prompt_versions_agent_promptVersion_idx" ON "prompt_versions"("agent", "promptVersion");
CREATE INDEX "audit_logs_incidentId_idx" ON "audit_logs"("incidentId");
CREATE INDEX "incident_analysis_jobs_incidentId_idx" ON "incident_analysis_jobs"("incidentId");
CREATE UNIQUE INDEX "executive_summaries_analysisRunId_key" ON "executive_summaries"("analysisRunId");
CREATE UNIQUE INDEX "postmortems_analysisRunId_key" ON "postmortems"("analysisRunId");
CREATE UNIQUE INDEX "dependency_graphs_analysisRunId_key" ON "dependency_graphs"("analysisRunId");
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");
CREATE UNIQUE INDEX "team_members_teamId_email_key" ON "team_members"("teamId", "email");

-- AddForeignKey
ALTER TABLE "incident_analysis_jobs" ADD CONSTRAINT "incident_analysis_jobs_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "incidents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "analysis_runs" ADD CONSTRAINT "analysis_runs_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "similar_incident_snapshots" ADD CONSTRAINT "similar_incident_snapshots_analysisRunId_fkey" FOREIGN KEY ("analysisRunId") REFERENCES "analysis_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_run_metrics" ADD CONSTRAINT "agent_run_metrics_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "executive_summaries" ADD CONSTRAINT "executive_summaries_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "executive_summaries" ADD CONSTRAINT "executive_summaries_analysisRunId_fkey" FOREIGN KEY ("analysisRunId") REFERENCES "analysis_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "postmortems" ADD CONSTRAINT "postmortems_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "postmortems" ADD CONSTRAINT "postmortems_analysisRunId_fkey" FOREIGN KEY ("analysisRunId") REFERENCES "analysis_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "dependency_graphs" ADD CONSTRAINT "dependency_graphs_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "dependency_graphs" ADD CONSTRAINT "dependency_graphs_analysisRunId_fkey" FOREIGN KEY ("analysisRunId") REFERENCES "analysis_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "incidents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "teams" ADD CONSTRAINT "teams_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
