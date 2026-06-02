"use client";

import { IncidentCard } from "../../../components/incident/incident-card";

import { useIncidents } from "../../../features/incidents/hooks/use-incidents";
import {
  AlertTriangle,
  Activity,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";
import { IncidentTrendsChart } from "../../../components/dashboard/incident-trends-chart";
import { useEffect, useState } from "react";

import { useSocket } from "../../../providers/socket-provider";

import { queryClient } from "../../../lib/query-client";

import { StatsCard } from "../../../components/dashboard/stats-card";
import { toast } from "sonner";
import { IncidentDetailsDrawer } from "../../../components/incident/incident-details-drawer";
import { Incident } from "../../../features/incidents/types/incident.type";
import { useIncidentTrends } from "../../../features/incidents/hooks/use-incident-trends";

export default function IncidentsPage() {
  const { data: incidents, isLoading } = useIncidents();
  const { socket } = useSocket();
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(
    null,
  );
  const [activityFeed, setActivityFeed] = useState<string[]>([]);
  const [liveStages, setLiveStages] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");

  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [timeFormat, setTimeFormat] = useState<"12h" | "24h">("24h");

  const filteredIncidents = incidents?.filter((incident) => {
    const matchesSearch = incident.title
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesSeverity =
      severityFilter === "ALL" || incident.severity === severityFilter;

    const matchesStatus =
      statusFilter === "ALL" || incident.status === statusFilter;

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  useEffect(() => {
    socket.on("job-progress", (data) => {
      setLiveStages((prev) => ({
        ...prev,
        [data.jobId]: data.stage,
      }));
      setActivityFeed((prev) => [
        `[${new Date().toLocaleTimeString()}] ${data.stage.replaceAll("_", " ")}`,
        ...prev.slice(0, 9),
      ]);
    });
    socket.on("incident-completed", () => {
      queryClient.invalidateQueries({
        queryKey: ["incidents"],
      });

      toast.success("Incident analysis completed");
    });

    return () => {
      socket.off("job-progress");
      socket.off("incident-completed");
    };
  }, [socket, queryClient]);

  const severityAnalytics = {
    CRITICAL:
      incidents?.filter((incident) => incident.severity === "CRITICAL")
        .length ?? 0,

    HIGH:
      incidents?.filter((incident) => incident.severity === "HIGH").length ?? 0,

    MEDIUM:
      incidents?.filter((incident) => incident.severity === "MEDIUM").length ??
      0,

    LOW:
      incidents?.filter((incident) => incident.severity === "LOW").length ?? 0,
  };
  const { data: trendData } = useIncidentTrends();

  return (
    <div className="space-y-8">
      <div
        className="
    grid grid-cols-1
    gap-6 md:grid-cols-2
    xl:grid-cols-4
  "
      >
        <StatsCard
          title="Total Incidents"
          value={incidents?.length ?? 0}
          icon={Activity}
          description="All tracked incidents"
          color="bg-blue-500"
        />

        <StatsCard
          title="Critical Issues"
          value={
            incidents?.filter((incident) => incident.severity === "CRITICAL")
              .length ?? 0
          }
          icon={ShieldAlert}
          description="Require immediate action"
          color="bg-red-500"
        />
        <div
          className="
    rounded-3xl border
    border-zinc-800
    bg-zinc-900 p-6
  "
        >
          <h2
            className="
      text-lg font-semibold
      text-white
    "
          >
            Live System Activity
          </h2>

          <div className="mt-4 space-y-3">
            {activityFeed.length === 0 ? (
              <p className="text-sm text-zinc-500">
                Waiting for realtime events...
              </p>
            ) : (
              activityFeed.map((activity, index) => (
                <div
                  key={index}
                  className="
            rounded-xl border
            border-zinc-800
            bg-zinc-950 px-4 py-3
            text-sm text-zinc-300
          "
                >
                  {activity}
                </div>
              ))
            )}
          </div>
        </div>

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
          description="Successfully resolved"
          color="bg-emerald-500"
        />
      </div>
      <div
        className="
    rounded-3xl border
    border-zinc-800
    bg-zinc-900 p-6
  "
      >
        <div
          className="
      flex items-center
      justify-between
    "
        >
          <div>
            <h2
              className="
          text-lg font-semibold
          text-white
        "
            >
              Incident Severity Distribution
            </h2>

            <p
              className="
          mt-1 text-sm
          text-zinc-400
        "
            >
              Realtime incident breakdown
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTimeFormat("12h")}
            className="
              rounded-full border
              border-zinc-800
              px-3 py-1 text-xs
              text-zinc-400
            "
          >
            12h
          </button>

          <button
            onClick={() => setTimeFormat("24h")}
            className="
              rounded-full border
              border-zinc-800
              px-3 py-1 text-xs
              text-zinc-400
            "
          >
            24h
          </button>
        </div>

        <IncidentTrendsChart data={trendData ?? []} timeFormat={timeFormat} />
      </div>
      <div>
        <h1
          className="
            text-4xl font-bold
            tracking-tight text-white
          "
        >
          Incidents
        </h1>

        <p
          className="
            mt-2 text-zinc-400
          "
        >
          Monitor and investigate AI-powered incident analysis
        </p>
      </div>
      <div className="mt-6">
        <input
          type="text"
          placeholder="Search incidents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="
      w-full rounded-2xl
      border border-zinc-800
      bg-zinc-900 px-4 py-3
      text-sm text-white
      outline-none transition
      placeholder:text-zinc-500
      focus:border-violet-500/40
    "
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((severity) => (
          <button
            key={severity}
            onClick={() => setSeverityFilter(severity)}
            className={`
          rounded-full border px-4 py-2
          text-xs font-medium transition

          ${
            severityFilter === severity
              ? "border-violet-500/30 bg-violet-500/10 text-violet-300"
              : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700"
          }
        `}
          >
            {severity}
          </button>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        {["ALL", "PENDING", "PROCESSING", "COMPLETED", "FAILED"].map(
          (status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`
        rounded-full border px-4 py-2
        text-xs font-medium transition

        ${
          statusFilter === status
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
            : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700"
        }
      `}
            >
              {status}
            </button>
          ),
        )}
      </div>

      {isLoading ? (
        <div className="text-zinc-400">Loading incidents...</div>
      ) : (
        <div
          className="
            grid grid-cols-1
            gap-6 xl:grid-cols-2
          "
        >
          {filteredIncidents?.map((incident) => (
            <div
              key={incident.id}
              onClick={() => setSelectedIncident(incident)}
              className="cursor-pointer"
            >
              <IncidentCard
                incident={incident}
                liveStage={liveStages[incident.id]}
              />
            </div>
          ))}
          <IncidentDetailsDrawer
            incident={selectedIncident}
            onClose={() => setSelectedIncident(null)}
          />
        </div>
      )}
    </div>
  );
}
