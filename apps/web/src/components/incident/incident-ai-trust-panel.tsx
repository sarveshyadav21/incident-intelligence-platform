"use client";

import type {
  AiEvaluation,
  IncidentEvaluation,
  RootCauseHypothesis,
} from "../../features/incidents/types/incident.type";

type Props = {
  evaluations: IncidentEvaluation[];
  aiInsights?: Partial<AiEvaluation> | null;
  hypotheses: RootCauseHypothesis[];
};

const riskStyles = {
  LOW: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
  MEDIUM: "text-yellow-400 border-yellow-500/20 bg-yellow-500/5",
  HIGH: "text-red-400 border-red-500/20 bg-red-500/5",
};

export function IncidentAiTrustPanel({
  evaluations,
  aiInsights,
  hypotheses,
}: Props) {
  const latestEvaluation = evaluations[0];

  return (
    <div className="space-y-6">
      {latestEvaluation && (
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-violet-400">
            Quality Scores
          </h3>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <ScoreCard
              label="Faithfulness"
              value={latestEvaluation.faithfulnessScore}
            />
            <ScoreCard
              label="Hallucination"
              value={latestEvaluation.hallucinationScore}
              invert
            />
            <ScoreCard label="Accuracy" value={latestEvaluation.accuracyScore} />
          </div>
        </section>
      )}

      {aiInsights?.hallucinationRisk && (
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-orange-400">
            Adversarial Review
          </h3>
          <div
            className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-medium ${
              riskStyles[aiInsights.hallucinationRisk]
            }`}
          >
            Hallucination risk: {aiInsights.hallucinationRisk}
          </div>
          {aiInsights.unsupportedClaims &&
            aiInsights.unsupportedClaims.length > 0 && (
              <ul className="mt-3 space-y-2">
                {aiInsights.unsupportedClaims.map((claim) => (
                  <li
                    key={claim}
                    className="rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-foreground/80"
                  >
                    {claim}
                  </li>
                ))}
              </ul>
            )}
        </section>
      )}

      {aiInsights?.situationJudgment && (
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-400">
            Situation Judgment
          </h3>
          <div className="mt-3 space-y-2 rounded-2xl border border-border bg-card/60 p-4 text-sm text-foreground/80">
            <p>
              <span className="text-muted-foreground">Urgency:</span>{" "}
              {aiInsights.situationJudgment.urgency}
            </p>
            <p>
              <span className="text-muted-foreground">Response mode:</span>{" "}
              {aiInsights.situationJudgment.recommendedResponseMode}
            </p>
            <p>
              <span className="text-muted-foreground">Blast radius:</span>{" "}
              {aiInsights.situationJudgment.blastRadius}
            </p>
            <p className="leading-6">{aiInsights.situationJudgment.rationale}</p>
          </div>
        </section>
      )}

      {aiInsights?.evidence && aiInsights.evidence.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-400">
            Extracted Evidence
          </h3>
          <div className="mt-3 space-y-3">
            {aiInsights.evidence.map((item, index) => (
              <div
                key={`${item.quote}-${index}`}
                className="rounded-2xl border border-border bg-card/60 p-4"
              >
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  {item.signalType}
                </p>
                <p className="mt-2 font-mono text-xs text-muted-foreground">
                  {item.quote}
                </p>
                <p className="mt-2 text-sm leading-6 text-foreground/80">
                  {item.interpretation}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {hypotheses.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Root Cause Hypotheses
          </h3>
          <div className="mt-3 space-y-3">
            {hypotheses.map((hypothesis) => (
              <div
                key={hypothesis.id}
                className="rounded-2xl border border-border bg-card/60 p-4"
              >
                <p className="text-sm text-foreground/80">{hypothesis.hypothesis}</p>
                <p className="mt-2 text-xs text-violet-400">
                  Confidence {hypothesis.confidenceScore}%
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ScoreCard({
  label,
  value,
  invert = false,
}: {
  label: string;
  value?: number | null;
  invert?: boolean;
}) {
  const display =
    value === null || value === undefined
      ? "—"
      : `${Math.round(value * (value <= 1 ? 100 : 1))}%`;

  const tone =
    value === null || value === undefined
      ? "text-muted-foreground"
      : invert
        ? value > 0.5
          ? "text-red-400"
          : "text-emerald-400"
        : value >= 0.7
          ? "text-emerald-400"
          : "text-yellow-400";

  return (
    <div className="rounded-2xl border border-border bg-background p-4 text-center">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-2 text-xl font-semibold ${tone}`}>{display}</p>
    </div>
  );
}
