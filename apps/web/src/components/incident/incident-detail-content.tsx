"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { SeverityBadge } from "./severity-badge";
import { IncidentTimeline } from "./incident-timeline";
import { IncidentAiTrustPanel } from "./incident-ai-trust-panel";
import { IncidentUploadPanel } from "./incident-upload-panel";
import { IncidentFeedbackSection } from "./incident-feedback-section";
import { extractAiEvaluationFromTimeline } from "../../features/incidents/utils/timeline-metadata";
import { useAnalysisJobsStore } from "../../features/incidents/store/analysis-jobs.store";

import type { IncidentDetail } from "../../features/incidents/types/incident.type";

type Props = {
  incident: IncidentDetail;
  timelineEvents?: IncidentDetail["timelineEvents"];
  timelineLoading?: boolean;
  liveStage?: string;
  showWorkspaceLink?: boolean;
};

export function IncidentDetailContent({
  incident,
  timelineEvents,
  timelineLoading,
  liveStage,
  showWorkspaceLink = true,
}: Props) {
  const events = timelineEvents ?? incident.timelineEvents ?? [];
  const aiInsights = extractAiEvaluationFromTimeline(events);
  const displaySeverity = incident.aiSeverity ?? incident.severity;
  const streamingSummary = useAnalysisJobsStore(
    (state) => state.streamingSummaries[`${incident.id}:summary`],
  );
  const feedback = incident.feedback ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">{incident.title}</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Created {new Date(incident.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SeverityBadge severity={incident.severity} />
          {incident.aiSeverity && incident.aiSeverity !== incident.severity && (
            <SeverityBadge severity={incident.aiSeverity} />
          )}
          <span className="rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-400">
            {incident.status}
            {liveStage ? ` · ${liveStage.replaceAll("_", " ")}` : ""}
          </span>
        </div>
      </div>

      {incident.confidenceScore != null && (
        <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 px-4 py-3 text-sm text-violet-300">
          AI confidence: {Math.round(incident.confidenceScore)}%
          {displaySeverity !== incident.severity && (
            <span className="ml-2 text-zinc-400">
              · AI reclassified severity to {displaySeverity}
            </span>
          )}
        </div>
      )}

      <Section title="Attachments">
        <IncidentUploadPanel
          incidentId={incident.id}
          uploads={incident.uploads ?? []}
        />
      </Section>

      {incident.summary && (
        <Section title="Source logs / summary">
          <p className="whitespace-pre-wrap font-mono text-sm leading-6 text-zinc-400">
            {incident.summary}
          </p>
        </Section>
      )}

      {(streamingSummary || incident.aiSummary) && (
        <Section title="AI summary" accent="violet">
          <p className="leading-7 text-zinc-300">
            {streamingSummary || incident.aiSummary}
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

      {incident.rootCause && (
        <Section title="Root cause analysis" accent="red">
          <p className="leading-7 text-zinc-300">{incident.rootCause}</p>
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
          <p className="leading-7 text-zinc-300">{incident.impactAssessment}</p>
        </Section>
      )}

      {incident.detectionSource && (
        <Section title="Detection source" accent="cyan">
          <p className="text-zinc-300">{incident.detectionSource}</p>
        </Section>
      )}

      {incident.affectedServices && incident.affectedServices.length > 0 && (
        <Section title="Affected services">
          <div className="flex flex-wrap gap-2">
            {incident.affectedServices.map((service) => (
              <span
                key={service}
                className="rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-400"
              >
                {service}
              </span>
            ))}
          </div>
        </Section>
      )}

      {incident.remediationSteps && incident.remediationSteps.length > 0 && (
        <Section title="Remediation steps" accent="emerald">
          <div className="space-y-3">
            {incident.remediationSteps.map((step, index) => (
              <div
                key={step}
                className="flex gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-semibold text-emerald-400">
                  {index + 1}
                </span>
                <p className="text-sm leading-6 text-zinc-300">{step}</p>
              </div>
            ))}
          </div>
          <IncidentFeedbackSection
            incidentId={incident.id}
            field="remediation"
            label="remediation"
            value={incident.remediationSteps.join("\n")}
            feedback={feedback}
          />
        </Section>
      )}

      <Section title="AI trust & evidence">
        <IncidentAiTrustPanel
          evaluations={incident.evaluations}
          aiInsights={aiInsights}
          hypotheses={incident.hypotheses}
        />
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
              : "text-zinc-500";

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
