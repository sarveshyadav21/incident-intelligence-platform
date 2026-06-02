import { create } from "zustand";

type AnalysisJobsState = {
  jobToIncident: Record<string, string>;
  incidentToJob: Record<string, string>;
  liveStages: Record<string, string>;
  activityFeed: string[];
  streamingSummaries: Record<string, string>;
  registerJob: (jobId: string, incidentId: string) => void;
  setLiveStage: (incidentId: string, stage: string) => void;
  pushActivity: (message: string) => void;
  appendStreamToken: (incidentId: string, agent: string, token: string) => void;
  setStreamComplete: (incidentId: string, agent: string, content: string) => void;
  clearStream: (incidentId: string) => void;
  clearJob: (jobId: string) => void;
};

export const useAnalysisJobsStore = create<AnalysisJobsState>((set) => ({
  jobToIncident: {},
  incidentToJob: {},
  liveStages: {},
  activityFeed: [],
  streamingSummaries: {},

  registerJob: (jobId, incidentId) =>
    set((state) => ({
      jobToIncident: { ...state.jobToIncident, [jobId]: incidentId },
      incidentToJob: { ...state.incidentToJob, [incidentId]: jobId },
    })),

  setLiveStage: (incidentId, stage) =>
    set((state) => ({
      liveStages: { ...state.liveStages, [incidentId]: stage },
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

  clearJob: (jobId) =>
    set((state) => {
      const incidentId = state.jobToIncident[jobId];
      const { [jobId]: _removedJob, ...jobToIncident } = state.jobToIncident;
      const { [incidentId]: _removedIncident, ...incidentToJob } =
        state.incidentToJob;

      return { jobToIncident, incidentToJob };
    }),
}));
