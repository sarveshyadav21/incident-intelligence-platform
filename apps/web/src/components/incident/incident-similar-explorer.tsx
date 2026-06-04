"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { GitCompareArrows } from "lucide-react";

import { getSimilarIncidents } from "../../features/incidents/api/incident-api";
import { incidentQueryKeys } from "../../features/incidents/hooks/incident-query-keys";

type Props = {
  incidentId: string;
  embedded?: SimilarIncident[];
};

type SimilarIncident = {
  id: string;
  title: string;
  rootCause?: string | null;
  similarity: number;
};

export function IncidentSimilarExplorer({ incidentId, embedded }: Props) {
  const query = useQuery({
    queryKey: incidentQueryKeys.similar(incidentId),
    queryFn: () => getSimilarIncidents(incidentId),
    enabled: !embedded?.length,
    staleTime: 120_000,
  });

  const similar = embedded?.length ? embedded : (query.data ?? []);

  if (query.isLoading && !embedded?.length) {
    return <p className="text-sm text-muted-foreground">Finding similar incidents...</p>;
  }

  if (similar.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No similar historical incidents yet. Embeddings populate after the first
        completed analysis.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <GitCompareArrows className="h-4 w-4 text-violet-400" />
        Related incidents from vector similarity search
      </div>

      {similar.map((item) => (
        <Link
          key={item.id}
          href={`/incidents/${item.id}`}
          className="block rounded-xl border border-border bg-background p-4 transition hover:border-violet-500/30"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-zinc-200">{item.title}</p>
              {item.rootCause && (
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {item.rootCause}
                </p>
              )}
            </div>
            <span className="shrink-0 rounded-full bg-violet-500/10 px-2 py-1 text-xs font-semibold text-violet-300">
              {item.similarity}%
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
