import { create } from "zustand";

import type { AgentEvent } from "../../../types/agent-event";
import type { AnalysisJobStatus } from "../types/incident.type";

type AnalysisJobsState = {
  jobToIncident: Record<string, string>;
  incidentToJob: Record<string, string>;
  liveStages: Record<string, string>;
  jobStatuses: Record<string, AnalysisJobStatus>;
  activityFeed: string[];
  streamingSummaries: Record<string, string>;
  agentLifecycleByIncident: Record<string, AgentEvent[]>;
  registerJob: (jobId: string, incidentId: string) => void;
  setLiveStage: (incidentId: string, stage: string) => void;
  setJobStatus: (jobId: string, status: AnalysisJobStatus) => void;
  pushActivity: (message: string) => void;
  appendStreamToken: (incidentId: string, agent: string, token: string) => void;
  setStreamComplete: (incidentId: string, agent: string, content: string) => void;
  pushAgentLifecycle: (incidentId: string, event: AgentEvent) => void;
  clearStream: (incidentId: string) => void;
  clearAgentLifecycle: (incidentId: string) => void;
  clearJob: (jobId: string) => void;
};

export const useAnalysisJobsStore = create<AnalysisJobsState>((set) => ({
  jobToIncident: {},
  incidentToJob: {},
  liveStages: {},
  jobStatuses: {},
  activityFeed: [],
  streamingSummaries: {},
  agentLifecycleByIncident: {},

  registerJob: (jobId, incidentId) =>
    set((state) => ({
      jobToIncident: { ...state.jobToIncident, [jobId]: incidentId },
      incidentToJob: { ...state.incidentToJob, [incidentId]: jobId },
    })),

  setLiveStage: (incidentId, stage) =>
    set((state) => ({
      liveStages: { ...state.liveStages, [incidentId]: stage },
    })),

  setJobStatus: (jobId, status) =>
    set((state) => ({
      jobStatuses: { ...state.jobStatuses, [jobId]: status },
    })),

  pushActivity: (message) =>
    set((state) => ({
      activityFeed: [message, ...state.activityFeed].slice(0, 10),
    })),

  appendStreamToken: (incidentId, agent, token) =>
    set((state) => {
      const key = `${incidentId}:${agent}`;
      return {
        streamingSummaries: {
          ...state.streamingSummaries,
          [key]: (state.streamingSummaries[key] ?? "") + token,
        },
      };
    }),

  setStreamComplete: (incidentId, agent, content) =>
    set((state) => ({
      streamingSummaries: {
        ...state.streamingSummaries,
        [`${incidentId}:${agent}`]: content,
      },
    })),

  pushAgentLifecycle: (incidentId, event) =>
    set((state) => {
      const existing = state.agentLifecycleByIncident[incidentId] ?? [];
      const updated = [...existing, event].slice(-20);

      return {
        agentLifecycleByIncident: {
          ...state.agentLifecycleByIncident,
          [incidentId]: updated,
        },
      };
    }),

  clearStream: (incidentId) =>
    set((state) => {
      const streamingSummaries = { ...state.streamingSummaries };
      Object.keys(streamingSummaries).forEach((key) => {
        if (key.startsWith(`${incidentId}:`)) {
          delete streamingSummaries[key];
        }
      });
      return { streamingSummaries };
    }),

  clearAgentLifecycle: (incidentId) =>
    set((state) => {
      const { [incidentId]: _removed, ...agentLifecycleByIncident } =
        state.agentLifecycleByIncident;
      return { agentLifecycleByIncident };
    }),

  clearJob: (jobId) =>
    set((state) => {
      const incidentId = state.jobToIncident[jobId];
      const { [jobId]: _removedJob, ...jobToIncident } = state.jobToIncident;
      const { [incidentId]: _removedIncident, ...incidentToJob } =
        state.incidentToJob;

      return { jobToIncident, incidentToJob };
    }),
}));
