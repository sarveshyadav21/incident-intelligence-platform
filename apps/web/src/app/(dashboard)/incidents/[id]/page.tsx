"use client";

import Link from "next/link";
import { use, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { socket } from "../../../../lib/socket";

import { useIncident } from "../../../../features/incidents/hooks/use-incident";
import { useIncidentTimeline } from "../../../../features/incidents/hooks/use-incident-timeline";
import { useIncidentSocket } from "../../../../features/incidents/hooks/use-incident-socket";
import { useAnalysisJobsStore } from "../../../../features/incidents/store/analysis-jobs.store";
import { useIncidentJobId } from "../../../../features/incidents/hooks/use-incident-job-id";
import { IncidentDetailContent } from "../../../../components/incident/incident-detail-content";

type IncidentPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default function IncidentDetailPage({ params }: IncidentPageProps) {
  const { id } = use(params);
  useIncidentSocket();

  const { data: incident, isLoading, isError } = useIncident(id);
  const jobId = useIncidentJobId(incident ?? null);
  const liveStage = useAnalysisJobsStore((state) => state.liveStages[id]);
  const agentEvents = useAnalysisJobsStore(
    (state) => state.agentLifecycleByIncident[id] ?? [],
  );
  const { data: timelineEvents, isLoading: timelineLoading } =
    useIncidentTimeline(jobId ?? null, id);

  useEffect(() => {
    socket.emit("join-incident", id);
    return () => {
      socket.emit("leave-incident", id);
    };
  }, [id]);

  if (isLoading) {
    return <p className="text-muted-foreground">Loading investigation workspace...</p>;
  }

  if (isError || !incident) {
    return (
      <div className="space-y-4">
        <Link
          href="/incidents"
          className="inline-flex items-center gap-2 text-sm text-violet-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to incidents
        </Link>
        <p className="text-muted-foreground">Incident not found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/incidents"
        className="inline-flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to incidents
      </Link>

      <IncidentDetailContent
        incident={incident}
        timelineEvents={timelineEvents ?? incident.timelineEvents}
        timelineLoading={timelineLoading}
        liveStage={liveStage}
        agentEvents={agentEvents}
        showWorkspaceLink={false}
      />
    </div>
  );
}
