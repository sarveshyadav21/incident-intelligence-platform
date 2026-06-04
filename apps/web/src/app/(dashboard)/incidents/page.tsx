"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Activity,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";

import { IncidentCard } from "../../../components/incident/incident-card";
import { IncidentDetailsDrawer } from "../../../components/incident/incident-details-drawer";
import { IncidentIngestDialog } from "../../../components/incident/incident-ingest-dialog";
import { IncidentTrendsChart } from "../../../components/dashboard/incident-trends-chart";
import { LiveActivityFeed } from "../../../components/dashboard/live-activity-feed";
import { StatsCard } from "../../../components/dashboard/stats-card";
import { useIncidents } from "../../../features/incidents/hooks/use-incidents";
import { useIncidentTrends } from "../../../features/incidents/hooks/use-incident-trends";
import { useIncidentSocket } from "../../../features/incidents/hooks/use-incident-socket";
import { useAnalysisJobsStore } from "../../../features/incidents/store/analysis-jobs.store";

export default function IncidentsPage() {
  useIncidentSocket();

  const { data: incidents, isLoading } = useIncidents();
  const { data: trendData } = useIncidentTrends();
  const liveStages = useAnalysisJobsStore((state) => state.liveStages);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(
    null,
  );
  const activityFeed = useAnalysisJobsStore((state) => state.activityFeed);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [timeFormat, setTimeFormat] = useState<"12h" | "24h">("24h");

  const filteredIncidents = incidents?.filter((incident) => {
    const matchesSearch =
      incident.title.toLowerCase().includes(search.toLowerCase()) ||
      (incident.aiSummary ?? incident.summary ?? "")
        .toLowerCase()
        .includes(search.toLowerCase());

    const effectiveSeverity = incident.aiSeverity ?? incident.severity;
    const matchesSeverity =
      severityFilter === "ALL" || effectiveSeverity === severityFilter;

    const matchesStatus =
      statusFilter === "ALL" || incident.status === statusFilter;

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const severityAnalytics = {
    CRITICAL:
      incidents?.filter(
        (i) => (i.aiSeverity ?? i.severity) === "CRITICAL",
      ).length ?? 0,
    HIGH:
      incidents?.filter((i) => (i.aiSeverity ?? i.severity) === "HIGH")
        .length ?? 0,
    MEDIUM:
      incidents?.filter((i) => (i.aiSeverity ?? i.severity) === "MEDIUM")
        .length ?? 0,
    LOW:
      incidents?.filter((i) => (i.aiSeverity ?? i.severity) === "LOW").length ??
      0,
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Incidents
          </h1>
          <p className="mt-2 text-muted-foreground">
            Monitor and investigate AI-powered incident analysis
          </p>
        </div>
        <IncidentIngestDialog />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Total Incidents"
          value={incidents?.length ?? 0}
          icon={Activity}
          description="All tracked incidents"
          color="bg-blue-500"
        />
        <StatsCard
          title="Critical Issues"
          value={severityAnalytics.CRITICAL}
          icon={ShieldAlert}
          description="AI-weighted critical count"
          color="bg-red-500"
        />
        <StatsCard
          title="Processing"
          value={
            incidents?.filter((incident) => incident.status === "PROCESSING")
              .length ?? 0
          }
          icon={AlertTriangle}
          description="AI analysis running"
          color="bg-yellow-500"
        />
        <StatsCard
          title="Resolved"
          value={
            incidents?.filter((incident) => incident.status === "COMPLETED")
              .length ?? 0
          }
          icon={CheckCircle2}
          description="Successfully analyzed"
          color="bg-emerald-500"
        />
      </div>

      <LiveActivityFeed activities={activityFeed} />

      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Incident Severity Distribution
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Uses AI severity when analysis is complete
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setTimeFormat("12h")}
              className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
            >
              12h
            </button>
            <button
              onClick={() => setTimeFormat("24h")}
              className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
            >
              24h
            </button>
          </div>
        </div>
        <IncidentTrendsChart data={trendData ?? []} timeFormat={timeFormat} />
      </div>

      <div>
        <input
          type="text"
          placeholder="Search incidents..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-violet-500/40"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((severity) => (
          <button
            key={severity}
            onClick={() => setSeverityFilter(severity)}
            className={`rounded-full border px-4 py-2 text-xs font-medium transition ${
              severityFilter === severity
                ? "border-violet-500/30 bg-violet-500/10 text-violet-300"
                : "border-border bg-card text-muted-foreground hover:border-border"
            }`}
          >
            {severity}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        {["ALL", "PENDING", "PROCESSING", "COMPLETED", "FAILED"].map(
          (status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-full border px-4 py-2 text-xs font-medium transition ${
                statusFilter === status
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : "border-border bg-card text-muted-foreground hover:border-border"
              }`}
            >
              {status}
            </button>
          ),
        )}
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading incidents...</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {filteredIncidents?.map((incident) => (
            <div
              key={incident.id}
              onClick={() => setSelectedIncidentId(incident.id)}
              className="cursor-pointer"
            >
              <IncidentCard
                incident={incident}
                liveStage={liveStages[incident.id]}
              />
            </div>
          ))}
        </div>
      )}

      <IncidentDetailsDrawer
        incidentId={selectedIncidentId}
        onClose={() => setSelectedIncidentId(null)}
      />
    </div>
  );
}
