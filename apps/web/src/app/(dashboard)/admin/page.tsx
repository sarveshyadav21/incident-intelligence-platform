"use client";

import { useQuery } from "@tanstack/react-query";

import {
  getAgentMetrics,
  getModelUsage,
  getQueueHealth,
} from "../../../features/incidents/api/incident-api";
import { incidentQueryKeys } from "../../../features/incidents/hooks/incident-query-keys";

export default function AdminDashboardPage() {
  const queue = useQuery({
    queryKey: incidentQueryKeys.queueHealth(),
    queryFn: getQueueHealth,
    refetchInterval: 10_000,
  });

  const agents = useQuery({
    queryKey: incidentQueryKeys.agentMetrics(),
    queryFn: getAgentMetrics,
    refetchInterval: 30_000,
  });

  const models = useQuery({
    queryKey: incidentQueryKeys.modelUsage(),
    queryFn: getModelUsage,
    refetchInterval: 30_000,
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Operations Dashboard</h1>
        <p className="mt-2 text-zinc-400">
          Queue health, agent performance, and model usage analytics
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          label="Queued"
          value={queue.data?.bullmq.queued ?? "—"}
        />
        <MetricCard
          label="Running"
          value={queue.data?.bullmq.running ?? "—"}
        />
        <MetricCard
          label="Retrying"
          value={queue.data?.bullmq.retrying ?? "—"}
        />
        <MetricCard
          label="Failed"
          value={queue.data?.bullmq.failed ?? "—"}
        />
        <MetricCard
          label="Completed"
          value={queue.data?.bullmq.completed ?? "—"}
        />
      </section>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
        <p className="text-sm text-zinc-400">
          System health:{" "}
          <span className="font-medium text-white">
            {queue.data?.health ?? "loading"}
          </span>
        </p>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-white">Agent performance</h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-800 text-zinc-500">
              <tr>
                <th className="px-4 py-3">Agent</th>
                <th className="px-4 py-3">Avg duration</th>
                <th className="px-4 py-3">Success rate</th>
                <th className="px-4 py-3">Runs</th>
              </tr>
            </thead>
            <tbody>
              {(agents.data ?? []).map((row) => (
                <tr key={row.agent} className="border-b border-zinc-900">
                  <td className="px-4 py-3 text-zinc-200">{row.agent}</td>
                  <td className="px-4 py-3 text-zinc-400">
                    {(row.avgDurationMs / 1000).toFixed(1)}s
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {Math.round(row.successRate * 100)}%
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{row.runCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">Model usage</h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-800 text-zinc-500">
              <tr>
                <th className="px-4 py-3">Model</th>
                <th className="px-4 py-3">Avg time</th>
                <th className="px-4 py-3">Est. tokens</th>
                <th className="px-4 py-3">Est. cost</th>
                <th className="px-4 py-3">Success</th>
              </tr>
            </thead>
            <tbody>
              {(models.data ?? []).map((row) => (
                <tr key={row.model} className="border-b border-zinc-900">
                  <td className="px-4 py-3 text-zinc-200">{row.model}</td>
                  <td className="px-4 py-3 text-zinc-400">
                    {(row.avgExecutionMs / 1000).toFixed(1)}s
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {row.estimatedTokens.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    ${row.estimatedCost}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {Math.round(row.successRate * 100)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
