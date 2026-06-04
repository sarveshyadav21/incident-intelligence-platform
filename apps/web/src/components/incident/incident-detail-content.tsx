"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { SeverityBadge } from "./severity-badge";
import { IncidentTimeline } from "./incident-timeline";
import { IncidentAiTrustPanel } from "./incident-ai-trust-panel";
import { IncidentAgentLifecycle } from "./incident-agent-lifecycle";
import type { AgentEvent } from "@/types/agent-event";
import { IncidentUploadPanel } from "./incident-upload-panel";
import { IncidentFeedbackSection } from "./incident-feedback-section";
import { IncidentAnalysisProgress } from "./incident-analysis-progress";
import { IncidentSimilarExplorer } from "./incident-similar-explorer";
import { IncidentExecutiveSummary } from "./incident-executive-summary";
import { IncidentDependencyGraph } from "./incident-dependency-graph";
import { IncidentPostmortem } from "./incident-postmortem";
import { IncidentAnalysisHistory } from "./incident-analysis-history";
import { IncidentRetryHistory } from "./incident-retry-history";
import { IncidentRatingFeedback } from "./incident-rating-feedback";
import { extractAiEvaluationFromTimeline } from "../../features/incidents/utils/timeline-metadata";
import { useAnalysisJobsStore } from "../../features/incidents/store/analysis-jobs.store";

import type { AnalysisRun, IncidentDetail } from "../../features/incidents/types/incident.type";

type Props = {
  incident: IncidentDetail;
  timelineEvents?: IncidentDetail["timelineEvents"];
  timelineLoading?: boolean;
  liveStage?: string;
  agentEvents?: AgentEvent[];
  showWorkspaceLink?: boolean;
};

export function IncidentDetailContent({
  incident,
  timelineEvents,
  timelineLoading,
  liveStage,
  agentEvents = [],
  showWorkspaceLink = true,
}: Props) {
  const [selectedRun, setSelectedRun] = useState<AnalysisRun | null>(null);
  const events = timelineEvents ?? incident.timelineEvents ?? [];
  const timelineStages = events.map((event) => event.stage);
  const aiInsights = extractAiEvaluationFromTimeline(events);
  const displaySeverity = incident.aiSeverity ?? incident.severity;
  const streamingSummary = useAnalysisJobsStore(
    (state) => state.streamingSummaries[`${incident.id}:summary`],
  );
  const feedback = incident.feedback ?? [];

  const displayRootCause = selectedRun?.rootCause ?? incident.rootCause;
  const displaySummary = selectedRun?.aiSummary ?? incident.aiSummary;
  const displayRemediation =
    selectedRun?.remediationSteps ?? incident.remediationSteps;
  const displayConfidence =
    selectedRun?.confidenceScore ?? incident.confidenceScore;

  const similarFromRun = selectedRun?.similarSnapshots?.map((item) => ({
    id: item.targetIncidentId,
    title: item.targetTitle,
    similarity: Math.round(
      item.similarity <= 1 ? item.similarity * 100 : item.similarity,
    ),
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{incident.title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Created {new Date(incident.createdAt).toLocaleString()}
            {selectedRun ? ` · Viewing Run #${selectedRun.runNumber}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SeverityBadge severity={incident.severity} />
          {incident.aiSeverity && incident.aiSeverity !== incident.severity && (
            <SeverityBadge severity={incident.aiSeverity} />
          )}
          <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
            {incident.status}
            {liveStage ? ` · ${liveStage.replaceAll("_", " ")}` : ""}
          </span>
        </div>
      </div>

      <IncidentAnalysisProgress
        timelineStages={timelineStages}
        incidentStatus={incident.status}
        liveStage={liveStage}
      />

      {displayConfidence != null && (
        <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 px-4 py-3 text-sm text-violet-300">
          AI confidence: {Math.round(displayConfidence)}%
          {displaySeverity !== incident.severity && (
            <span className="ml-2 text-muted-foreground">
              · AI reclassified severity to {displaySeverity}
            </span>
          )}
        </div>
      )}

      <Section title="Similar incidents">
        <IncidentSimilarExplorer
          incidentId={incident.id}
          embedded={similarFromRun}
        />
      </Section>

      <Section title="Incident dependency graph" accent="cyan">
        <IncidentDependencyGraph graph={incident.dependencyGraph} />
      </Section>

      <Section title="Executive summary" accent="violet">
        <IncidentExecutiveSummary summary={incident.executiveSummary} />
      </Section>

      <Section title="Auto postmortem" accent="emerald">
        <IncidentPostmortem postmortem={incident.postmortem} />
      </Section>

      <Section title="Analysis history">
        <IncidentAnalysisHistory
          runs={incident.analysisRuns ?? []}
          onSelectRun={setSelectedRun}
        />
      </Section>

      <Section title="Retry history">
        <IncidentRetryHistory incidentId={incident.id} />
      </Section>

      <Section title="Attachments">
        <IncidentUploadPanel
          incidentId={incident.id}
          uploads={incident.uploads ?? []}
        />
      </Section>

      {incident.summary && (
        <Section title="Source logs / summary">
          <p className="whitespace-pre-wrap font-mono text-sm leading-6 text-muted-foreground">
            {incident.summary}
          </p>
        </Section>
      )}

      {(streamingSummary || displaySummary) && (
        <Section title="AI summary" accent="violet">
          <p className="leading-7 text-foreground/80">
            {streamingSummary || displaySummary}
            {streamingSummary && incident.status === "PROCESSING" && (
              <span className="ml-1 inline-block h-4 w-1 animate-pulse bg-violet-400" />
            )}
          </p>
          <IncidentFeedbackSection
            incidentId={incident.id}
            field="aiSummary"
            label="AI summary"
            value={incident.aiSummary}
            feedback={feedback}
          />
        </Section>
      )}

      {displayRootCause && (
        <Section title="Root cause analysis" accent="red">
          <p className="leading-7 text-foreground/80">{displayRootCause}</p>
          <IncidentFeedbackSection
            incidentId={incident.id}
            field="rootCause"
            label="root cause"
            value={incident.rootCause}
            feedback={feedback}
          />
        </Section>
      )}

      {incident.impactAssessment && (
        <Section title="Impact assessment" accent="orange">
          <p className="leading-7 text-foreground/80">{incident.impactAssessment}</p>
        </Section>
      )}

      {incident.detectionSource && (
        <Section title="Detection source" accent="cyan">
          <p className="text-foreground/80">{incident.detectionSource}</p>
        </Section>
      )}

      {incident.affectedServices && incident.affectedServices.length > 0 && (
        <Section title="Affected services">
          <div className="flex flex-wrap gap-2">
            {incident.affectedServices.map((service) => (
              <span
                key={service}
                className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
              >
                {service}
              </span>
            ))}
          </div>
        </Section>
      )}

      {displayRemediation && displayRemediation.length > 0 && (
        <Section title="Remediation steps" accent="emerald">
          <div className="space-y-3">
            {displayRemediation.map((step, index) => (
              <div
                key={step}
                className="flex gap-3 rounded-2xl border border-border bg-card/60 p-4"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-semibold text-emerald-400">
                  {index + 1}
                </span>
                <p className="text-sm leading-6 text-foreground/80">{step}</p>
              </div>
            ))}
          </div>
          <IncidentFeedbackSection
            incidentId={incident.id}
            field="remediation"
            label="remediation"
            value={(incident.remediationSteps ?? []).join("\n")}
            feedback={feedback}
          />
        </Section>
      )}

      <Section title="Analysis feedback">
        <IncidentRatingFeedback incidentId={incident.id} />
      </Section>

      <Section title="AI trust & evidence">
        <IncidentAiTrustPanel
          evaluations={incident.evaluations}
          aiInsights={aiInsights}
          hypotheses={incident.hypotheses}
        />
      </Section>

      <Section title="AI agent lifecycle" accent="violet">
        <IncidentAgentLifecycle events={agentEvents} />
      </Section>

      <Section title="Analysis pipeline timeline">
        <IncidentTimeline events={events} isLoading={timelineLoading} />
      </Section>

      {showWorkspaceLink && (
        <Link
          href={`/incidents/${incident.id}`}
          className="inline-flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300"
        >
          Open full investigation workspace
          <ExternalLink className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

function Section({
  title,
  children,
  accent,
}: {
  title: string;
  children: React.ReactNode;
  accent?: string;
}) {
  const accentClass =
    accent === "violet"
      ? "text-violet-400"
      : accent === "red"
        ? "text-red-400"
        : accent === "orange"
          ? "text-orange-400"
          : accent === "cyan"
            ? "text-cyan-400"
            : accent === "emerald"
              ? "text-emerald-400"
              : "text-muted-foreground";

  return (
    <section>
      <h3
        className={`text-sm font-semibold uppercase tracking-wide ${accentClass}`}
      >
        {title}
      </h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}
