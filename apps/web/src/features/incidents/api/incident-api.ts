import { api } from "../../../lib/axios";
import { unwrapApiData, type ApiResponse } from "../../../lib/api-response";

import type {
  AgentPerformanceMetric,
  AnalysisRun,
  AnalyzeAndStoreInput,
  AnalyzeIncidentResponse,
  CreateIncidentInput,
  CreateFeedbackInput,
  CreateRatingFeedbackInput,
  EnqueueAnalysisResponse,
  Incident,
  IncidentDetail,
  IncidentFeedback,
  IncidentTimelineEvent,
  IncidentTrendBucket,
  IncidentUpload,
  JobStatusResponse,
  ModelUsageMetric,
  QueueHealth,
  SimilarIncidentMatch,
} from "../types/incident.type";

function parseRemediationSteps(
  steps: unknown,
): string[] | undefined {
  if (!steps) {
    return undefined;
  }

  if (Array.isArray(steps)) {
    return steps.map(String);
  }

  return undefined;
}

function normalizeIncident<T extends Incident>(incident: T): T {
  return {
    ...incident,
    remediationSteps: parseRemediationSteps(incident.remediationSteps),
    affectedServices: incident.affectedServices ?? [],
  };
}

function normalizeIncidentDetail(incident: IncidentDetail): IncidentDetail {
  return {
    ...normalizeIncident(incident),
    feedback: incident.feedback ?? [],
    uploads: incident.uploads ?? [],
    evaluations: incident.evaluations ?? [],
    timelineEvents: incident.timelineEvents ?? [],
    hypotheses: incident.hypotheses ?? [],
  };
}

export async function getIncidents(): Promise<Incident[]> {
  const response = await api.get<ApiResponse<Incident[]>>("/incidents");
  const incidents = unwrapApiData(response);

  return incidents.map((incident) => normalizeIncident(incident));
}

export async function getIncidentById(id: string): Promise<IncidentDetail> {
  const response = await api.get<ApiResponse<IncidentDetail>>(`/incidents/${id}`);
  return normalizeIncidentDetail(unwrapApiData(response));
}

export async function createIncident(
  input: CreateIncidentInput,
): Promise<Incident> {
  const response = await api.post<ApiResponse<Incident>>("/incidents", input);

  return normalizeIncident(unwrapApiData(response));
}

export async function analyzeIncidentLogs(
  logs: string,
): Promise<AnalyzeIncidentResponse> {
  const response = await api.post<ApiResponse<AnalyzeIncidentResponse>>(
    "/incidents/analyze",
    { logs },
  );

  return normalizeIncident(unwrapApiData(response));
}

export async function analyzeAndStoreIncident(
  input: AnalyzeAndStoreInput,
): Promise<EnqueueAnalysisResponse> {
  const response = await api.post<ApiResponse<EnqueueAnalysisResponse>>(
    "/incidents/analyze-and-store",
    input,
  );

  return unwrapApiData(response);
}

export async function getJobStatus(jobId: string): Promise<JobStatusResponse> {
  const response = await api.get<ApiResponse<JobStatusResponse>>(
    `/incidents/job/${jobId}`,
  );

  const status = unwrapApiData(response);

  if (status.result) {
    status.result = normalizeIncident(status.result);
  }

  return status;
}

export async function getIncidentTimeline(
  jobId: string,
): Promise<IncidentTimelineEvent[]> {
  const response = await api.get<ApiResponse<IncidentTimelineEvent[]>>(
    `/incidents/timeline/${jobId}`,
  );

  return unwrapApiData(response);
}

export async function getIncidentTrends(): Promise<IncidentTrendBucket[]> {
  const response = await api.get<ApiResponse<IncidentTrendBucket[]>>(
    "/incidents/analytics/trends",
  );

  return unwrapApiData(response);
}

export async function uploadIncidentFile(
  incidentId: string,
  file: File,
): Promise<IncidentUpload> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post<ApiResponse<IncidentUpload>>(
    `/incidents/${incidentId}/uploads`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );

  return unwrapApiData(response);
}

export async function deleteIncidentUpload(
  incidentId: string,
  uploadId: string,
): Promise<{ deleted: boolean }> {
  const response = await api.delete<ApiResponse<{ deleted: boolean }>>(
    `/incidents/${incidentId}/uploads/${uploadId}`,
  );

  return unwrapApiData(response);
}

export async function createIncidentFeedback(
  incidentId: string,
  input: CreateFeedbackInput,
): Promise<IncidentFeedback> {
  const response = await api.post<ApiResponse<IncidentFeedback>>(
    `/incidents/${incidentId}/feedback`,
    input,
  );

  return unwrapApiData(response);
}

export async function reanalyzeIncident(
  incidentId: string,
): Promise<EnqueueAnalysisResponse> {
  const response = await api.post<ApiResponse<EnqueueAnalysisResponse>>(
    `/incidents/${incidentId}/reanalyze`,
  );

  return unwrapApiData(response);
}

export async function getSimilarIncidents(
  incidentId: string,
): Promise<SimilarIncidentMatch[]> {
  const response = await api.get<ApiResponse<SimilarIncidentMatch[]>>(
    `/incidents/${incidentId}/similar`,
  );

  return unwrapApiData(response);
}

export async function getAnalysisRuns(
  incidentId: string,
): Promise<AnalysisRun[]> {
  const response = await api.get<ApiResponse<AnalysisRun[]>>(
    `/incidents/${incidentId}/analysis-runs`,
  );

  return unwrapApiData(response).map((run) => ({
    ...run,
    remediationSteps: parseRemediationSteps(run.remediationSteps),
  }));
}

export async function getRetryHistory(incidentId: string) {
  const response = await api.get<ApiResponse<unknown[]>>(
    `/incidents/${incidentId}/retry-history`,
  );

  return unwrapApiData(response);
}

export async function createRatingFeedback(
  incidentId: string,
  input: CreateRatingFeedbackInput,
): Promise<IncidentFeedback> {
  const response = await api.post<ApiResponse<IncidentFeedback>>(
    `/incidents/${incidentId}/feedback/rating`,
    input,
  );

  return unwrapApiData(response);
}

export async function getQueueHealth(): Promise<QueueHealth> {
  const response = await api.get<ApiResponse<QueueHealth>>(
    "/incidents/admin/queue",
  );

  return unwrapApiData(response);
}

export async function getAgentMetrics(): Promise<AgentPerformanceMetric[]> {
  const response = await api.get<ApiResponse<AgentPerformanceMetric[]>>(
    "/incidents/admin/agents/metrics",
  );

  return unwrapApiData(response);
}

export async function getModelUsage(): Promise<ModelUsageMetric[]> {
  const response = await api.get<ApiResponse<ModelUsageMetric[]>>(
    "/incidents/admin/models/usage",
  );

  return unwrapApiData(response);
}
